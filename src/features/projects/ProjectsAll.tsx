import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAllProjects } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { useToasts } from "../../app/ToastProvider";
import { supabase } from "../../lib/supabase";
export default function ProjectsAll() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [filterTag, setFilterTag] = useState<"all" | "crochet" | "knit">("all");
  const location = useLocation();
  const isArchivedView = location.pathname.includes("/projects/archived");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const p = await fetchAllProjects(user.id, isArchivedView ? true : false);
        setProjects(p ?? []);
      } catch (e: any) {
        // if archive column missing, show message
        if (/archived/.test(e.message ?? "")) {
          console.error(e);
          addToast({ message: "Archiving not available", kind: "error", duration: 10000 });
        } else {
          console.error(e);
        }
      }
    })();
  }, [user, location.pathname]);

  const { addToast } = useToasts();
  const navigate = useNavigate();
  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .filter((p) => (filterTag === "all" ? true : (p.tag ?? "") === filterTag));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState<"crochet" | "knit" | "">("");

  async function startEdit(p: any) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditTag((p.tag as any) ?? "");
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from("projects").update({ name: editName, tag: editTag || null }).eq("id", id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to save", kind: "error" });
      return;
    }
    setEditingId(null);
    // refresh list
    const p = await fetchAllProjects(user!.id, isArchivedView ? true : false);
    setProjects(p ?? []);
    addToast({ message: "Saved", kind: "success" });
  }

  async function archiveProject(p: any) {
    const { error } = await supabase.from("projects").update({ archived: true }).eq("id", p.id);
    if (error) {
      console.error(error);
      // If the 'archived' column doesn't exist, show an actionable message to the developer
      const isMissingColumn = /column\s+"archived"\s+does\s+not\s+exist/i.test(error.message ?? "");
      if (isMissingColumn) {
        addToast({
          message: "Archiving failed: missing `archived` column in DB.",
          kind: "error",
          duration: 10000,
        });
        return;
      }

      addToast({ message: "Failed to archive", kind: "error" });
      return;
    }
    const fresh = await fetchAllProjects(user!.id, isArchivedView ? true : false);
    setProjects(fresh ?? []);

    addToast({
      message: `Archived ${p.name}`,
      kind: "info",
      action: {
        label: "Undo",
        onClick: async () => {
          await supabase.from("projects").update({ archived: false }).eq("id", p.id);
          const f = await fetchAllProjects(user!.id, isArchivedView ? true : false);
          setProjects(f ?? []);
          addToast({ message: "Unarchived", kind: "success" });
        },
      },
    });
  }

  async function unarchiveProject(p: any) {
    const { error } = await supabase.from("projects").update({ archived: false }).eq("id", p.id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to unarchive", kind: "error" });
      return;
    }
    const fresh = await fetchAllProjects(user!.id, isArchivedView ? true : false);
    setProjects(fresh ?? []);
    addToast({
      message: `Unarchived ${p.name}`,
      kind: "success",
      action: {
        label: "Undo",
        onClick: async () => {
          await supabase.from("projects").update({ archived: true }).eq("id", p.id);
          const f = await fetchAllProjects(user!.id, isArchivedView ? true : false);
          setProjects(f ?? []);
          addToast({ message: "Archived", kind: "info" });
        },
      },
    });
  }

  async function deleteProject(p: any) {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to delete", kind: "error" });
      return;
    }
    const fresh = await fetchAllProjects(user!.id);
    setProjects(fresh ?? []);

    addToast({
      message: `Deleted ${p.name}`,
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            // attempt to restore a minimal project
            await supabase.from("projects").insert({ user_id: user!.id, name: p.name });
            const f = await fetchAllProjects(user!.id);
            setProjects(f ?? []);
            addToast({ message: "Restored", kind: "success" });
          } catch (e) {
            console.error(e);
            addToast({ message: "Failed to restore", kind: "error" });
          }
        },
      },
      kind: "info",
    });
  }

  return (
    <div className="container">
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2>{isArchivedView ? "Archived projects" : "Projects"}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="search-input" placeholder="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="search-input" style={{ width: 120 }} value={filterTag} onChange={(e) => setFilterTag(e.target.value as any)}>
              <option value="all">All</option>
              <option value="crochet">Crochet</option>
              <option value="knit">Knit</option>
            </select>
          </div>
        </div>

        <div className="projects-grid" style={{ marginTop: 12 }}>
          {filtered.map((p) => (
            <div key={p.id} className={"project-card"}>
              <div className="project-card-link" role="link" tabIndex={0} onClick={() => navigate(`/project/${p.id}`, { state: { fromCategory: p.category_id } })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/project/${p.id}`, { state: { fromCategory: p.category_id } }); }}>
                <div className="project-card-name">{p.name}</div>
                <div className="project-card-meta">{p.row_count ?? 0} rows · {p.stitch_count ?? 0} stitches</div>
                {p.tag && <div style={{ marginTop: 8, fontSize: 13, color: "var(--accent)" }}>{p.tag}</div>}
              </div>

              <div className="project-card-actions">
                {editingId === p.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <select value={editTag} onChange={(e) => setEditTag(e.target.value as any)}>
                      <option value="">(none)</option>
                      <option value="crochet">Crochet</option>
                      <option value="knit">Knit</option>
                    </select>
                    <button className="btn-ctrl" onClick={() => saveEdit(p.id)}>Save</button>
                    <button className="btn-ctrl reset" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isArchivedView ? (
                      <>
                        <button className="btn-ctrl small" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn-ctrl small" onClick={() => archiveProject(p)}>Archive</button>
                        <button className="btn-ctrl reset small" onClick={() => deleteProject(p)}>Delete</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-ctrl small" onClick={() => unarchiveProject(p)}>Unarchive</button>
                        <button className="btn-ctrl reset small" onClick={() => deleteProject(p)}>Delete</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ marginTop: 12 }} className="muted">{isArchivedView ? 'No archived projects found.' : 'No projects found.'}</div>
        )}
      </div>
    </div>
  );
}
