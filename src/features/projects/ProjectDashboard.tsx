import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchProject, updateProjectCounters, fetchCategory } from "../api";
import RowCounter from "../counters/RowCounter";
import StitchCounter from "../counters/StitchCounter";
import { useTimer } from "../../hooks/userTimer";
import ProjectInventory from "./ProjectInventory";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { useToasts } from "../../app/ToastProvider";

export default function ProjectDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToasts();
  const [project, setProject] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionStartSeconds, setSessionStartSeconds] = useState<number>(0);

  // load project and sessions
  useEffect(() => {
    if (!id) return;
    (async () => {
      const p = await fetchProject(id);
      setProject(p);
      await loadSessions();
    })();
  }, [id]);

  async function loadSessions() {
    if (!id || !user) return;
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('project_id', id)
      .order('started_at', { ascending: false });
    
    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      setSessions(data ?? []);
    }
  }

  useEffect(() => {
    if (!project?.id) return;
    const pendingKey = `project-pending-save:${project.id}`;
    const lastKey = `project-timer-last:${project.id}`;

    try {
      const rawPending = localStorage.getItem(pendingKey);
      const rawLast = localStorage.getItem(lastKey);

      let pending: any = null;
      let last: any = null;
      if (rawPending) pending = JSON.parse(rawPending);
      if (rawLast) last = JSON.parse(rawLast);

      const toApply = Math.max(project.total_time_seconds ?? 0, (pending?.total_time_seconds) ?? 0, (last?.total_time_seconds) ?? 0);
      if (typeof toApply === "number" && toApply > (project.total_time_seconds ?? 0)) {
        updateProjectCounters(project.id, { total_time_seconds: toApply })
          .then(() => {
            try { localStorage.removeItem(pendingKey); localStorage.removeItem(lastKey); } catch (e) {}
          })
          .catch(console.error);
      }
    } catch (e) {
      console.error(e);
    }
  }, [project?.id, project?.total_time_seconds]);

  const navigate = useNavigate();
  const location = useLocation();
  const fromCategory = (location.state as any)?.fromCategory as string | undefined;

  const [category, setCategory] = useState<any | null>(null);
  useEffect(() => {
    if (!project?.category_id) return;
    (async () => {
      try {
        const c = await fetchCategory(project.category_id);
        setCategory(c ?? null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [project?.category_id]);

  const initialSeconds = project?.total_time_seconds ?? 0;
  const { elapsed, running, start: startTimer, pause: pauseTimer } = useTimer({
    initialSeconds,
    autoPauseOnBlur: false,
    onTickSeconds: undefined,
  });

  async function start() {
    setSessionStartTime(Date.now());
    setSessionStartSeconds(elapsed);
    startTimer();
  }

  async function pause() {
    pauseTimer();
    await saveSession();
  }

  async function saveSession() {
    if (!project?.id || !user || !sessionStartTime) return;
    
    const duration = Math.floor(elapsed - sessionStartSeconds);
    if (duration < 1) return; // Don't save sessions less than 1 second

    const { error } = await supabase.from('timer_sessions').insert({
      project_id: project.id,
      user_id: user.id,
      started_at: new Date(sessionStartTime).toISOString(),
      duration_seconds: duration,
    });

    if (error) {
      console.error('Error saving session:', error);
      addToast({ message: 'Failed to save timer session', kind: 'error' });
    } else {
      await loadSessions();
      setSessionStartTime(null);
      
      // Also update the project's total_time_seconds for backward compatibility
      const updated = await updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) });
      if (updated) {
        setProject((p: any) => ({ ...p, total_time_seconds: updated.total_time_seconds }));
        try { 
          localStorage.removeItem(`project-pending-save:${project.id}`); 
          localStorage.removeItem(`project-timer-last:${project.id}`); 
        } catch (e) {}
      }
    }
  }

  useEffect(() => {
    if (!project?.id) return;
    let intervalId: number | null = null;

    function writeLast() {
      try {
        localStorage.setItem(`project-timer-last:${project.id}`, JSON.stringify({ total_time_seconds: Math.floor(elapsed), ts: Date.now() }));
      } catch (e) {}
    }

    intervalId = window.setInterval(writeLast, 5000);

    function onVisibility() {
      if (document.hidden) writeLast();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      try { localStorage.setItem(`project-timer-last:${project.id}`, JSON.stringify({ total_time_seconds: Math.floor(elapsed), ts: Date.now() })); } catch (e) {}
    };
  }, [project?.id, elapsed]);

 
  useEffect(() => {
    return () => {
      if (!project?.id) return;

      updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) }).catch(console.error);
    };
  }, [elapsed, project]);

  useEffect(() => {
    if (!project?.id) return;
    let timeout: number | null = null;

    async function saveNow() {
      try {
        await updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) });
      } catch (e) {
        console.error(e);
      }
    }

    function onUnload() {
      try {
        const payload = { projectId: project.id, total_time_seconds: Math.floor(elapsed) };
        try { localStorage.setItem(`project-pending-save:${project.id}`, JSON.stringify(payload)); } catch (e) {}
      } catch (err) {}
    }

    if (running) {
      const id = window.setInterval(saveNow, 30000);
      timeout = id;
    }

    window.addEventListener("beforeunload", onUnload);

    return () => {
      if (timeout) window.clearInterval(timeout);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [project?.id, elapsed, running]);

  async function onRowChange(newRow: number) {
    if (!project?.id) return;
    setProject((p: any) => ({ ...p, row_count: newRow }));
    updateProjectCounters(project.id, { row_count: newRow }).catch(console.error);
  }
  async function onStitchChange(newStitch: number) {
    if (!project?.id) return;
    setProject((p: any) => ({ ...p, stitch_count: newStitch }));
    updateProjectCounters(project.id, { stitch_count: newStitch }).catch(console.error);
  }

  function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate total time from all sessions
  const totalSessionTime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
  
  // Current session time is the difference between elapsed and initial
  const currentSessionTime = sessionStartTime ? Math.floor(elapsed - sessionStartSeconds) : 0;

  if (!project) return <div>Loading project...</div>;

  return (
    <div className="panel">
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-ctrl reset small" onClick={() => { if (fromCategory) navigate(`/category/${fromCategory}`); else navigate(-1); }}>← Back</button>
        {category && (
          <button className="btn-ctrl small" onClick={() => navigate(`/category/${category.id}`)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--muted)', padding: '6px 10px' }}>{category.name}</button>
        )}
      </div>
      <h2>{project.name} {project.tag && <span style={{ color: 'var(--accent)', fontSize: '0.9rem', marginLeft: 8 }}>{project.tag}</span>}</h2>

      <div className="project-layout">
        <div className="project-details">
          <div className="counters-grid">
            <RowCounter value={project.row_count ?? 0} onChange={onRowChange} />
            <StitchCounter value={project.stitch_count ?? 0} onChange={onStitchChange} />
          </div>

          <div style={{ marginTop: 16 }}>
            <ProjectInventory projectId={project.id} />
          </div>
        </div>

        <div className="timer-sidebar">
          <div className="timer-container">
            <div className="project-timer">
              <div className="timer-label">
                <strong>Current Session:</strong> 
                <span className="timer-value">{running ? formatDuration(currentSessionTime) : '0s'}</span>
              </div>
              <div className="timer-controls" role="group" aria-label="Timer controls">
                {!running ? (
                  <button className="btn-ctrl" onClick={start}>Start</button>
                ) : (
                  <button className="btn-ctrl" onClick={pause}>Pause</button>
                )}
              </div>
            </div>

            <div className="total-time">
              <strong>Total Time:</strong>
              <div className="total-time-value">{formatDuration(totalSessionTime)}</div>
            </div>
          </div>

          <div className="timer-sessions">
            <h3>Work Sessions</h3>
            {sessions.length > 0 ? (
              <div className="sessions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td>{formatDate(session.started_at)}</td>
                        <td>{formatDuration(session.duration_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No sessions recorded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
