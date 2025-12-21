import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../features/auth/AuthProvider";

export default function ProjectInventory({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setInventory(data ?? []));
  }, [user]);

  async function attach(inventoryId: string) {
    if (!user) return;
    await supabase.from("project_inventory").insert({
      project_id: projectId,
      inventory_id: inventoryId,
      user_id: user.id,
    });
    alert("Attached");
  }

  return (
    <div>
      <h4>Assign Tools & Yarn</h4>
      {inventory.map((i) => (
        <button key={i.id} onClick={() => attach(i.id)}>
          Add {i.name}
        </button>
      ))}
    </div>
  );
}
