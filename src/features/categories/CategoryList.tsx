import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchCategories, createCategory, fetchAllProjects } from "../api";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useToasts } from "../../app/ToastProvider";

export default function CategoryList() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  async function load() {
    if (!user) return;
    const data = await fetchCategories(user.id);
    setCategories(data ?? []);

    // load recent projects to show under categories
    try {
      const rp = await fetchAllProjects(user.id, false as any);
      setRecentProjects((rp ?? []).slice(0, 2));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreate() {
    if (!user || !name.trim()) return;
    const cat = await createCategory(user.id, name.trim());
    setName("");
    await load();
    if (cat?.id) navigate(`/category/${cat.id}`);
  }

  function startEdit(c: any) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from("categories").update({ name: editName }).eq("id", id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to save category", kind: "error" });
      return;
    }
    setEditingId(null);
    await load();
    addToast({ message: "Saved", kind: "success" });
  }

  async function deleteCategory(c: any) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to delete category", kind: "error" });
      return;
    }
    await load();
    addToast({ message: "Deleted", kind: "info" });
  }

  return (
    <div className="container">
      <div className="panel">
        <h2>Categories</h2>
        <div className="form-row">
          <input placeholder="category name" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={handleCreate}>Add</button>
        </div>

        <div className="categories-grid">
          {categories.map((c) => (
            <div key={c.id}
              className="project-card"
              role={editingId === c.id ? undefined : "button"}
              tabIndex={editingId === c.id ? undefined : 0}
              onClick={() => { if (editingId !== c.id) navigate(`/category/${c.id}`); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && editingId !== c.id) navigate(`/category/${c.id}`); }}
            >
              {editingId === c.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                  <input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    style={{ flex: '1 1 auto', minWidth: '120px' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn-ctrl" onClick={() => saveEdit(c.id)}>Save</button>
                    <button className="btn-ctrl reset" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button className="btn-ctrl small" onClick={(e) => { e.stopPropagation(); startEdit(c); }}>Edit</button>
                    <button className="btn-ctrl reset small" onClick={(e) => { e.stopPropagation(); deleteCategory(c); }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <hr />
        <div>
          <h3>Recent projects</h3>
          <div className="projects-grid" style={{ marginTop: 8 }}>
            {recentProjects.map((r: any) => (
              <div key={r.id} className="project-card" onClick={() => navigate(`/project/${r.id}`, { state: { fromCategory: r.category_id } })} role="button" tabIndex={0}>
                <div className="project-card-name">{r.name}</div>
                <div className="project-card-meta">{r.row_count ?? 0} rows · {r.stitch_count ?? 0} stitches</div>
                {r.tag && <div style={{ marginTop: 8, fontSize: 13, color: "var(--accent)" }}>{r.tag}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
