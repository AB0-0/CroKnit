import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchInventory, createInventoryItem } from "../api";

export default function InventoryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState<"yarn" | "hook" | "needle">("yarn");
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const data = await fetchInventory(user.id);
    setItems(data ?? []);
  }

  async function handleAdd() {
    if (!user || !name.trim()) return;
    await createInventoryItem(user.id, type, name, size, remaining);
    setName("");
    setSize("");
    setRemaining(0);
    load();
  }

  return (
    <div className="container">
      <div className="panel">
        <h2>Inventory</h2>

        <div className="form-row">
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="yarn">Yarn</option>
            <option value="hook">Hook</option>
            <option value="needle">Needle</option>
          </select>

          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} />
          <input
            type="number"
            placeholder="Remaining"
            value={remaining}
            onChange={(e) => setRemaining(Number(e.target.value))}
          />

          <button onClick={handleAdd}>Add</button>
        </div>

        <ul className="list">
          {items.map((i) => (
            <li key={i.id} className="list-item">
              [{i.item_type}] {i.name} {i.size && `(${i.size})`} {i.remaining != null && `– ${i.remaining}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
