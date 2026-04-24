import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EverestHome } from "@/components/home/EverestHome";
import type { TrendingProduct } from "@/components/home/types";

export const metadata: Metadata = {
  title: "Everest — Premium Marketplace",
  description: "Modern e-commerce for custom furniture, tech, apparel, and home office — with Yasmine AI assistance."
};

export default async function HomePage() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("products")
    .select("id, name, slug, base_price, vendor:vendors(company_name)")
    .limit(8);

  const initialProducts: TrendingProduct[] = (rows ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? "Product"),
    slug: r.slug != null ? String(r.slug) : null,
    base_price: r.base_price != null ? Number(r.base_price) : null,
    vendorLabel: (r.vendor as { company_name?: string } | null)?.company_name ?? null
  }));

  return <EverestHome initialProducts={initialProducts} />;
}
