import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../features/auth/AuthProvider";
import { useToasts } from "../../app/ToastProvider";

export default function ProjectInventory({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [attached, setAttached] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const { addToast } = useToasts();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: inv } = await supabase.from("inventory").select("*").eq("user_id", user!.id);
      setInventory(inv ?? []);
      const { data: attachedRows } = await supabase
        .from("project_inventory")
        .select("inventory_id")
        .eq("project_id", projectId);
      setAttached((attachedRows ?? []).map((r: any) => r.inventory_id));
    }
    load();
  }, [user, projectId]);
  async function attach(inventoryId: string) {
    if (!user) return;
    if (attached.includes(inventoryId)) return;
    setAttached((s) => [...s, inventoryId]);
    const { error: insertError } = await supabase.from("project_inventory").insert({ project_id: projectId, inventory_id: inventoryId, user_id: user!.id });
    if (insertError) {
      console.error(insertError);
      setAttached((s) => s.filter((id) => id !== inventoryId));
      addToast({ message: "Failed to attach", kind: "error" });
      return;
    }

    addToast({
      message: `Added ${inventory.find((x) => x.id === inventoryId)?.name}`,
      action: { label: "Undo", onClick: () => detach(inventoryId) },
      duration: 6000,
      kind: "success",
    });
  }

  async function detach(inventoryId: string) {
    if (!user) return;
    setAttached((s) => s.filter((id) => id !== inventoryId));
    const { error: delError } = await supabase
      .from("project_inventory")
      .delete()
      .eq("project_id", projectId)
      .eq("inventory_id", inventoryId);
    if (delError) {
      console.error(delError);
      setAttached((s) => [...s, inventoryId]);
      addToast({ message: "Failed to remove", kind: "error" });
      return;
    }

    addToast({
      message: `Removed ${inventory.find((x) => x.id === inventoryId)?.name}`,
      action: { label: "Undo", onClick: () => attach(inventoryId) },
      duration: 6000,
      kind: "info",
    });
  }

  return (
    <div className="project-inventory">
      <h4>Assign Tools & Yarn</h4>

      <div className="inventory-layout">
        <div className="inventory-column">
          <input
            className="search-input"
            placeholder="Filter inventory"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter inventory"
          />

          <div className="inventory-grid" aria-live="polite">
            {inventory
              .filter((i) => !attached.includes(i.id))
              .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
              .map((i) => (
                <div key={i.id} className="inventory-card">
                  <div className="inventory-card-info">
                    <div className="inventory-card-name">{i.name}</div>
                    <div className="inventory-card-meta">{i.item_type}{i.size ? ` · ${i.size}` : ""}</div>
                  </div>
                  <div>
                    <button className="btn-ctrl small primary" onClick={() => attach(i.id)} aria-label={`Add ${i.name}`}>Add</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <aside className="attached-column">
          <div className="attached-heading">Attached</div>
          <div className="attached-list">
            {attached.length === 0 && <div className="muted">No items attached</div>}
            {attached.map((id) => {
              const it = inventory.find((i) => i.id === id);
              if (!it) return null;
              return (
                <div key={id} className="inventory-card attached-inventory-card">
                  <div className="inventory-card-info">
                    <div className="inventory-card-name">{it.name}</div>
                    <div className="inventory-card-meta">{it.item_type}{it.size ? ` · ${it.size}` : ""}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn-ctrl reset small" onClick={() => detach(it.id)} aria-label={`Remove ${it.name}`}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
