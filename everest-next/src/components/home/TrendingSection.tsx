import { ProductCard, type ProductCardProps } from "./ProductCard";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";

const TARGET = 8;

function buildCards(products: ProductCardProps[]): ProductCardProps[] {
  if (products.length >= TARGET) return products.slice(0, TARGET);
  const need = TARGET - products.length;
  const filler: ProductCardProps[] = Array.from({ length: need }).map((_, i) => ({
    id: `demo-${i}`,
    title: ["Everest Desk Pro", "Neon Rail Keyboard", "Linen Executive Shirt", "Ergo Mesh Chair"][i % 4],
    priceLabel: `${(129 + i * 37).toLocaleString()} TND`,
    rating: 4.2 + (i % 3) * 0.3,
    reviewCount: 42 + i * 17,
    imageSrc: PLACEHOLDER_IMG,
    href: "/#trending"
  }));
  return [...products, ...filler];
}

export function TrendingSection({ cards }: { cards: ProductCardProps[] }) {
  const list = buildCards(cards);

  return (
    <section id="trending" className="bg-charcoal-soft py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-everest">Amazon-style feed</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Trending now</h2>
          </div>
          <p className="text-sm text-white/50">Image · title · price · stars · add to cart</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c) => (
            <ProductCard key={c.id} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
