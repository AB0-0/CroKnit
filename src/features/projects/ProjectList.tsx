import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchProjectsByCategory, createProject } from "../api";
import { supabase } from "../../lib/supabase";
import { useToasts } from "../../app/ToastProvider";

export default function ProjectList() {
  const { id: categoryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filterTag, setFilterTag] = useState<"all" | "crochet" | "knit">("all");
  const { addToast } = useToasts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState<string>("");

  useEffect(() => {
    if (!user || !categoryId) return;
    load();
  }, [user, categoryId]);

  async function load() {
    if (!user || !categoryId) return;
    const data = await fetchProjectsByCategory(user.id, categoryId);
    setProjects(data ?? []);
  }

  async function handleCreate() {
    if (!user || !categoryId || !name.trim()) return;
    const p = await createProject(user.id, categoryId, name.trim(), tag || null);
    setName("");
    setTag("");
    await load();
    navigate(`/project/${p.id}`, { state: { fromCategory: categoryId } });
  }

  return (
    <div className="container">
      <div className="panel">
        <h2>Projects</h2>

        <div className="form-row">
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select value={tag} onChange={(e) => setTag(e.target.value as any)}>
            <option value="">(type)</option>
            <option value="crochet">Crochet</option>
            <option value="knit">Knit</option>
          </select>
          <button onClick={handleCreate}>Add Project</button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 }}>
          <input className="search-input" placeholder="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="search-input" style={{ width: 120 }} value={filterTag} onChange={(e) => setFilterTag(e.target.value as any)}>
            <option value="all">All</option>
            <option value="crochet">Crochet</option>
            <option value="knit">Knit</option>
          </select>
        </div>

        <div className="projects-grid" style={{ marginTop: 12 }}>
          {projects
            .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
            .filter(p => filterTag === 'all' ? true : (p.tag ?? '') === filterTag)
            .map((p) => (
            <div key={p.id} className={"project-card"}>
              <div className="project-card-link" role="link" tabIndex={0} onClick={() => navigate(`/project/${p.id}`, { state: { fromCategory: categoryId } })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/project/${p.id}`, { state: { fromCategory: categoryId } }); }}>
                <div className="project-card-name">{p.name}</div>
                <div className="project-card-meta">{p.row_count ?? 0} rows · {p.stitch_count ?? 0} stitches</div>
                {p.tag && <div style={{ marginTop: 8, fontSize: 13, color: "var(--accent)" }}>{p.tag}</div>}
              </div>

              <div className="project-card-actions">
                {editingId === p.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      style={{ flex: '1 1 auto', minWidth: '100px' }}
                    />
                    <select 
                      value={editTag} 
                      onChange={(e) => setEditTag(e.target.value as any)}
                      style={{ flexShrink: 0 }}
                    >
                      <option value="">(none)</option>
                      <option value="crochet">Crochet</option>
                      <option value="knit">Knit</option>
                    </select>
                    <button className="btn-ctrl" onClick={() => { supabase.from("projects").update({ name: editName, tag: editTag || null }).eq("id", p.id).then(async ({ error }) => { if (error) { addToast({ message: "Failed to save", kind: "error" }); console.error(error); return; } setEditingId(null); await load(); addToast({ message: "Saved", kind: "success" }); }); }}>Save</button>
                    <button className="btn-ctrl reset" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ctrl small" onClick={() => { setEditingId(p.id); setEditName(p.name); setEditTag((p.tag as any) ?? ""); }}>Edit</button>
                    <button className="btn-ctrl small" onClick={async () => {
                      const { error } = await supabase.from("projects").update({ archived: true }).eq("id", p.id);
                      if (error) {
                        console.error(error);
                        const isMissingColumn = /column\s+"archived"\s+does\s+not\s+exist/i.test((error.message ?? ""));
                        if (isMissingColumn) {
                          addToast({ message: "Archiving failed: missing `archived` column in DB.", kind: "error", duration: 10000 });
                          addToast({ message: "Run: ALTER TABLE projects ADD COLUMN archived boolean DEFAULT false; in Supabase SQL console", kind: "info", duration: 12000 });
                          return;
                        }
                        addToast({ message: "Failed to archive", kind: "error" });
                        return;
                      }
                      await load();
                      addToast({ message: `Archived ${p.name}`, kind: "info", action: { label: "Undo", onClick: async () => { await supabase.from("projects").update({ archived: false }).eq("id", p.id); await load(); addToast({ message: "Unarchived", kind: "success" }); } } });
                    }}>Archive</button>
                    <button className="btn-ctrl reset small" onClick={async () => { if (!confirm(`Delete project "${p.name}"?`)) return; const { error } = await supabase.from("projects").delete().eq("id", p.id); if (error) { addToast({ message: "Failed to delete", kind: "error" }); console.error(error); return; } await load(); addToast({ message: `Deleted ${p.name}`, kind: "info", action: { label: "Undo", onClick: async () => { await supabase.from("projects").insert({ user_id: user!.id, name: p.name, category_id: categoryId }); await load(); addToast({ message: "Restored", kind: "success" }); } } }); }}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
