import Link from "next/link";
import { Star } from "lucide-react";

export type ProductCardProps = {
  id: string;
  title: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  imageSrc: string;
  href: string;
};

export function ProductCard({ title, priceLabel, rating, reviewCount, imageSrc, href }: ProductCardProps) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const v = rating - i;
    if (v >= 1) return "full";
    if (v >= 0.5) return "half";
    return "empty";
  });

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-charcoal-soft/80 shadow-lg shadow-black/30 transition hover:border-everest/40 hover:shadow-everest/10">
      <Link href={href} className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-800 to-charcoal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug text-white/95 transition hover:text-everest">
          {title}
        </Link>
        <div className="flex items-center gap-0.5 text-everest">
          {stars.map((kind, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                kind === "full" ? "fill-everest text-everest" : kind === "half" ? "fill-everest/50 text-everest" : "text-white/25"
              }`}
              strokeWidth={kind === "empty" ? 1.5 : 0}
            />
          ))}
          <span className="ml-1.5 text-xs text-white/50">({reviewCount})</span>
        </div>
        <p className="text-lg font-semibold tracking-tight text-white">{priceLabel}</p>
        <Link
          href={href}
          className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-everest py-2.5 text-sm font-semibold text-white transition hover:bg-everest-muted"
        >
          Add to Cart
        </Link>
      </div>
    </article>
  );
}
