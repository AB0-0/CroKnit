import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { fetchProject, updateProjectCounters } from "./api";
import RowCounter from "../counters/RowCounter";
import StitchCounter from "../counters/StitchCounter";
import { useTimer } from "../../hooks/userTimer";
import ProjectInventory from "./ProjectInventory";


export default function ProjectDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any | null>(null);

  // load project
  useEffect(() => {
    if (!id) return;
    (async () => {
      const p = await fetchProject(id);
      setProject(p);
    })();
  }, [id]);

  // Timer: initialize with project total_time_seconds
  const initialSeconds = project?.total_time_seconds ?? 0;
  const { elapsed, running, start, pause, reset, sync } = useTimer({
    initialSeconds,
    autoPauseOnBlur: true,
    onTickSeconds: undefined, // optional per-second callback
  });

  // When unmount or pause, sync DB
  useEffect(() => {
    return () => {
      if (!project?.id) return;
      // on unmount save current elapsed
      updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) }).catch(console.error);
    };
  }, [elapsed, project]);

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
    await updateProjectCounters(project.id, { total_time_seconds: Math.floor(elapsed) });
  }

  if (!project) return <div>Loading project...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>{project.name}</h2>
      <div>
        <strong>Timer:</strong> {Math.floor(elapsed)}s
        <div>
          {!running ? <button onClick={start}>Start</button> : <button onClick={pause}>Pause</button>}
          <button onClick={handlePauseSave}>Pause & Save</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <RowCounter value={project.row_count ?? 0} onChange={onRowChange} />
        <StitchCounter value={project.stitch_count ?? 0} onChange={onStitchChange} />
      </div>
      
      <div style={{ marginTop: 16 }}>
        <ProjectInventory projectId={project.id} />
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={async () => {
            // full save
            await updateProjectCounters(project.id, {
              total_time_seconds: Math.floor(elapsed),
              row_count: project.row_count,
              stitch_count: project.stitch_count,
            });
            alert("Saved");
          }}
        >
          Save now
        </button>
      </div>
    </div>
  );
}
