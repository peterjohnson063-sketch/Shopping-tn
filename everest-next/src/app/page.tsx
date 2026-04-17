import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, base_price, vendor:vendors(company_name)")
    .limit(6);

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Everest Marketplace</p>
        <h1 className="font-display text-5xl leading-tight">Custom Furniture, Crafted for Sahel Living</h1>
        <div className="flex gap-3">
          <Link href="/vendor" className="btn-light">
            Vendor Dashboard
          </Link>
          <Link href="/admin/vendors" className="btn-light">
            Admin Vendor Control
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {(products ?? []).map((p) => (
          <article key={p.id} className="card">
            <h3 className="font-display text-2xl">{p.name}</h3>
            <p className="mt-1 text-sm text-zinc-600">{(p.vendor as { company_name?: string })?.company_name}</p>
            <p className="mt-4 text-sm">From ${p.base_price}</p>
            <Link href={`/products/${p.slug}`} className="btn-primary mt-5">
              Open Product
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
