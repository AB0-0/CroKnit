import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { fetchInventory, createInventoryItem } from "../api";
import { useToasts } from "../../app/ToastProvider";
import { supabase } from "../../lib/supabase";

export default function InventoryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState<"yarn" | "hook" | "needle">("yarn");
  const [name, setName] = useState("");
  const [size, setSize] = useState(""); 
  const [sizeMm, setSizeMm] = useState<number | null>(null);
  const [yarnType, setYarnType] = useState("");
  const [color, setColor] = useState("");
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

  const { addToast } = useToasts();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "yarn" | "hook" | "needle">("all");

  const filteredItems = items
    .filter((it) => (filterType === 'all' ? true : it.item_type === filterType))
    .filter((it) => {
      const hay = `${it.name ?? ''} ${it.yarn_type ?? ''} ${it.color ?? ''} ${it.size ?? ''} ${it.size_mm ?? ''}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editSizeMm, setEditSizeMm] = useState<number | null>(null);
  const [editYarnType, setEditYarnType] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editRemaining, setEditRemaining] = useState<number>(0);

  async function handleAdd() {
    if (!user || !name.trim()) return;
    setBusy(true);
    try {
      const opts: any = {};
      if (type === "yarn") {
        opts.color = color || null;
        opts.yarn_type = yarnType || null;
      } else {
        opts.size_mm = typeof sizeMm === "number" ? sizeMm : null;
      }

      const newItem = await createInventoryItem(user.id, type, name, type === "yarn" ? size : undefined, remaining, opts);
      setName("");
      setSize("");
      setYarnType("");
      setColor("");
      setSizeMm(null);
      setRemaining(0);
      await load();
      addToast({
        message: `Added ${newItem?.name ?? name}`,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              if (newItem?.id) {
                await supabase.from("inventory").delete().eq("id", newItem.id);
                await load();
                addToast({ message: "Undo complete", kind: "info" });
              }
            } catch (e) {
              console.error(e);
              addToast({ message: "Failed to undo", kind: "error" });
            }
          },
        },
        kind: "success",
        duration: 6000,
      });
    } catch (e) {
      console.error(e);
      addToast({ message: "Error adding item", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item: any) {
    if (!user) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone easily.`)) return;
    const { error } = await supabase.from("inventory").delete().eq("id", item.id);
    if (error) {
      console.error(error);
      addToast({ message: "Failed to delete", kind: "error" });
      return;
    }

    await load();

    // undo action reinserts the same record
    addToast({
      message: `Deleted ${item.name}`,
      kind: "info",
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            await supabase.from("inventory").insert({ user_id: user!.id, item_type: item.item_type, name: item.name, size: item.size, remaining: item.remaining });
            await load();
            addToast({ message: "Restored", kind: "success" });
          } catch (e) {
            console.error(e);
            addToast({ message: "Failed to restore", kind: "error" });
          }
        },
      },
      duration: 6000,
    });
  }

  async function startEdit(item: any) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditSize(item.size ?? "");
    setEditSizeMm(item.size_mm ?? null);
    setEditYarnType(item.yarn_type ?? "");
    setEditColor(item.color ?? "");
    setEditRemaining(item.remaining ?? 0);
  }

  async function saveEdit(id: string) {
    const payload: any = { name: editName, remaining: editRemaining };
    if (editSize) payload.size = editSize;
    if (typeof editSizeMm === "number") payload.size_mm = editSizeMm;
    if (editYarnType) payload.yarn_type = editYarnType;
    if (editColor) payload.color = editColor;

    const { error } = await supabase.from("inventory").update(payload).eq("id", id);
    if (error) {
      console.error(error);
      addToast({ message: "Save failed", kind: "error" });
      return;
    }
    setEditingId(null);
    await load();
    addToast({ message: "Saved", kind: "success" });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="container">
      <div className="panel">
        <h2>Inventory</h2>

        {/* Filter & Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="search-input" style={{ width: 160 }}>
            <option value="all">All types</option>
            <option value="yarn">Yarn</option>
            <option value="hook">Hook</option>
            <option value="needle">Needle</option>
          </select>

          <input className="search-input" placeholder="Search inventory (name, color, yarn type, size)" value={query} onChange={(e) => setQuery(e.target.value)} />

          <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>{filteredItems.length} items</div>
        </div>

        <hr className="divider" />

        {/* Add Item */}
        <div className="form-row">
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="yarn">Yarn</option>
            <option value="hook">Hook</option>
            <option value="needle">Needle</option>
          </select>

          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

          {/* conditional inputs */}
          {type === "yarn" ? (
            <>
              <input placeholder="Yarn type (e.g. acrylic)" value={yarnType} onChange={(e) => setYarnType(e.target.value)} />
              <input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
              <input placeholder="Size (e.g. 4mm)" value={size} onChange={(e) => setSize(e.target.value)} />
            </>
          ) : (
            <>
              <input type="number" placeholder="Size (mm)" value={sizeMm ?? ""} onChange={(e) => setSizeMm(Number(e.target.value))} />
            </>
          )}

          <input
            type="number"
            placeholder="Remaining"
            value={remaining}
            onChange={(e) => setRemaining(Number(e.target.value))}
          />

          <button className="primary" onClick={handleAdd} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
        </div>

        <hr className="divider" />

        <div className="inventory-grid">
          {filteredItems.map((i) => (
              <div 
                key={i.id} 
                className="inventory-card"
                style={editingId === i.id ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}
              >
                {editingId === i.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                    {i.item_type === 'yarn' ? (
                      <>
                        <input 
                          value={editYarnType} 
                          onChange={(e) => setEditYarnType(e.target.value)} 
                          placeholder="Yarn type" 
                          style={{ width: '100%' }}
                        />
                        <input 
                          value={editColor} 
                          onChange={(e) => setEditColor(e.target.value)} 
                          placeholder="Color" 
                          style={{ width: '100%' }}
                        />
                        <input 
                          value={editSize} 
                          onChange={(e) => setEditSize(e.target.value)} 
                          placeholder="Size (e.g. 4mm)" 
                          style={{ width: '100%' }}
                        />
                      </>
                    ) : (
                      <input 
                        type="number" 
                        value={editSizeMm ?? ''} 
                        onChange={(e) => setEditSizeMm(Number(e.target.value))} 
                        placeholder="Size (mm)" 
                        style={{ width: '100%' }}
                      />
                    )}
                    <input 
                      type="number" 
                      value={editRemaining} 
                      onChange={(e) => setEditRemaining(Number(e.target.value))} 
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn-ctrl" onClick={() => saveEdit(i.id)}>Save</button>
                      <button className="btn-ctrl reset" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="inventory-card-info">
                      <div className="inventory-card-name">{i.name}</div>
                      <div className="inventory-card-meta">
                        [{i.item_type}]
                        {i.item_type === 'yarn' && i.yarn_type ? ` · ${i.yarn_type}` : ''}
                        {i.color ? ` · ${i.color}` : ''}
                        {i.size ? ` · ${i.size}` : i.size_mm ? ` · ${i.size_mm}mm` : ''}
                        {i.remaining != null && ` · ${i.remaining}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ctrl small" onClick={() => startEdit(i)}>Edit</button>
                      </div>
                      <button className="btn-ctrl reset small" onClick={() => handleDelete(i)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
