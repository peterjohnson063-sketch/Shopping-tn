import { requireRole } from "@/lib/auth";

export default async function VendorOrdersPage() {
  const { supabase, user } = await requireRole(["vendor", "admin"]);
  const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_user_id", user.id).single();

  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, client_name, notes, requested_dimensions, blender_model_url, status, created_at")
    .eq("vendor_id", vendor?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl">Custom Orders</h1>
      <div className="grid gap-4">
        {(orders ?? []).map((order) => (
          <article key={order.id} className="card">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h3 className="font-display text-2xl">{order.client_name}</h3>
                <p className="mt-2 text-sm text-zinc-600">{order.notes}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs capitalize">{order.status}</span>
            </div>
            <p className="mt-4 text-sm">
              Requested dimensions: {JSON.stringify(order.requested_dimensions ?? {})}
            </p>
            {order.blender_model_url ? (
              <a className="mt-3 inline-flex text-sm text-zinc-700 underline" href={order.blender_model_url} target="_blank">
                Open Blender File
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
