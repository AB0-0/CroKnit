import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchCategories, createCategory } from "../projects/api";
import { useNavigate } from "react-router-dom";

export default function CategoryList() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const data = await fetchCategories(user.id);
    setCategories(data ?? []);
  }

  async function handleCreate() {
    if (!user || !name.trim()) return;
    const cat = await createCategory(user.id, name.trim());
    setName("");
    await load();
    if (cat?.id) navigate(`/category/${cat.id}`);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Categories</h2>
      <div>
        <input placeholder="category name" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleCreate}>Add</button>
      </div>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            <a href={`#/category/${c.id}`}>{c.name}</a>
          </li>
        ))}
      </ul>
      <hr />
      <div>
        <h3>Recent projects</h3>
        <p>Open a category to see projects. (Expand this component later.)</p>
      </div>
    </div>
  );
}
