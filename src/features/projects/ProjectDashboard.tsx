import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchProject, updateProjectCounters, fetchCategory } from "../api";
import RowCounter from "../counters/RowCounter";
import StitchCounter from "../counters/StitchCounter";
import { useTimer } from "../../hooks/userTimer";
import ProjectInventory from "./ProjectInventory";

export default function ProjectDashboard() {
  const { id } = useParams();
  const [project, setProject] = useState<any | null>(null);

  // load project
  useEffect(() => {
    if (!id) return;
    (async () => {
      const p = await fetchProject(id);
      setProject(p);
    })();
  }, [id]);

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
  const { elapsed, running, start, pause } = useTimer({
    initialSeconds,
    autoPauseOnBlur: true,
    onTickSeconds: undefined,
  });

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

  async function handlePauseSave() {
    if (!project?.id) return;
    pause();
    const updated = await updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) });
    if (updated) {
      setProject((p: any) => ({ ...p, total_time_seconds: updated.total_time_seconds }));
      try { localStorage.removeItem(`project-pending-save:${project.id}`); localStorage.removeItem(`project-timer-last:${project.id}`); } catch (e) {}
    }
  }

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

      <div className="project-timer">
        <div className="timer-label"><strong>Timer:</strong> <span className="timer-value">{Math.floor(elapsed)}s</span></div>
        <div className="timer-controls" role="group" aria-label="Timer controls">
          {!running ? <button className="btn-ctrl" onClick={start}>Start</button> : <button className="btn-ctrl" onClick={pause}>Pause</button>}
          <button className="btn-ctrl" onClick={handlePauseSave}>Pause & Save</button>
        </div>
      </div>

      <div className="counters-grid">
        <RowCounter value={project.row_count ?? 0} onChange={onRowChange} />
        <StitchCounter value={project.stitch_count ?? 0} onChange={onStitchChange} />
      </div>

      <div style={{ marginTop: 16 }}>
        <ProjectInventory projectId={project.id} />
      </div>


    </div>
  );
}
