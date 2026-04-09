import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function VendorDashboardPage() {
  const { supabase, user } = await requireRole(["vendor", "admin"]);

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, company_name")
    .eq("owner_user_id", user.id)
    .single();

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendor?.id ?? "");

  const { count: customOrderCount } = await supabase
    .from("custom_orders")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendor?.id ?? "");

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Najjar Interface</p>
        <h1 className="font-display text-4xl">{vendor?.company_name ?? "Vendor Dashboard"}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="card">
          <p className="text-sm text-zinc-500">Inventory</p>
          <p className="mt-3 text-3xl font-semibold">{productCount ?? 0}</p>
          <Link href="/vendor/products/new" className="btn-primary mt-4">
            Add Product + Albums
          </Link>
        </article>
        <article className="card">
          <p className="text-sm text-zinc-500">Custom Orders</p>
          <p className="mt-3 text-3xl font-semibold">{customOrderCount ?? 0}</p>
          <Link href="/vendor/orders" className="btn-primary mt-4">
            View Custom Requests
          </Link>
        </article>
      </div>
    </section>
  );
}
