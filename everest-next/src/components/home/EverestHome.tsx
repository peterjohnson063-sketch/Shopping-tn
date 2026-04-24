"use client";

import type { TrendingProduct } from "./types";
import type { ProductCardProps } from "./ProductCard";
import { EverestAmazonHeader } from "@/components/layout/EverestAmazonHeader";
import { Hero } from "./Hero";
import { CategoryGrid } from "./CategoryGrid";
import { TrendingSection } from "./TrendingSection";
import { YasmineBubble } from "./YasmineBubble";
import { Footer } from "./Footer";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80";

function toCards(products: TrendingProduct[]): ProductCardProps[] {
  return products.map((p, idx) => ({
    id: String(p.id),
    title: p.name,
    priceLabel: p.base_price != null ? `${Number(p.base_price).toLocaleString()} TND` : "Price on request",
    rating: 4.3 + (idx % 4) * 0.15,
    reviewCount: 24 + idx * 11,
    imageSrc: PLACEHOLDER,
    href: p.slug ? `/products/${p.slug}` : "/#trending"
  }));
}

export function EverestHome({ initialProducts }: { initialProducts: TrendingProduct[] }) {
  const cards = toCards(initialProducts);

  return (
    <div className="min-h-screen bg-charcoal font-sans text-white">
      <EverestAmazonHeader cartCount={2} />
      <Hero />
      <CategoryGrid />
      <TrendingSection cards={cards} />
      <Footer />
      <YasmineBubble />
    </div>
  );
}
