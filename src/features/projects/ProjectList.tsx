import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchProjectsByCategory, createProject } from "../api";

export default function ProjectList() {
  const { id: categoryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");

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
    const p = await createProject(user.id, categoryId, name.trim());
    setName("");
    await load();
    navigate(`/project/${p.id}`);
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
          <button onClick={handleCreate}>Add Project</button>
        </div>

        <ul className="list">
          {projects.map((p) => (
            <li key={p.id} className="list-item">
              <a href={`#/project/${p.id}`}>{p.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
