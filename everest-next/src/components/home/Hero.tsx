"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Sparkles } from "lucide-react";

const SLIDES = [
  {
    eyebrow: "Everest Labs",
    title: "Configure your space in 3D",
    sub: "Premium materials · real-time preview · made-to-order",
    cta: "Open 3D Avatar Customizer",
    href: "/vendor",
    accent: "from-everest/30 via-charcoal-soft to-charcoal"
  },
  {
    eyebrow: "Signature drop",
    title: "Sahel craft, global finish",
    sub: "Hand-built furniture with logistics you can track",
    cta: "Explore custom furniture",
    href: "/#categories",
    accent: "from-indigo-500/20 via-charcoal-soft to-charcoal"
  },
  {
    eyebrow: "Members",
    title: "Founders Club early access",
    sub: "Limited releases and concierge ordering",
    cta: "Join the list",
    href: "/#footer",
    accent: "from-violet-500/25 via-charcoal-soft to-charcoal"
  }
];

export function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[i];

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-charcoal">
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent} transition-all duration-700`} />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-everest/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-20">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-everest">{slide.eyebrow}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            {slide.title}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/60">{slide.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 rounded-xl bg-everest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-everest/25 transition hover:bg-everest-muted"
            >
              <Sparkles className="h-4 w-4" />
              {slide.cta}
            </Link>
            <Link
              href="/#trending"
              className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/90 transition hover:border-everest/50 hover:bg-white/5"
            >
              View catalog
            </Link>
          </div>
          <div className="flex gap-2 pt-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-everest" : "w-2 bg-white/25 hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/80 to-charcoal shadow-2xl shadow-black/50">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="relative flex h-40 w-40 items-center justify-center perspective-[800px]">
                <div
                  className="absolute h-28 w-28 rounded-2xl border border-everest/40 bg-gradient-to-br from-everest/20 to-transparent shadow-lg shadow-everest/20"
                  style={{ transform: "rotateY(-18deg) rotateX(12deg)" }}
                />
                <div
                  className="absolute h-24 w-24 rounded-xl border border-white/20 bg-white/5 backdrop-blur"
                  style={{ transform: "translateZ(24px) rotateY(8deg)" }}
                />
                <Box className="relative z-10 h-14 w-14 text-everest" strokeWidth={1.25} />
              </div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/45">High-fidelity 3D render</p>
              <p className="max-w-xs text-sm text-white/55">Placeholder stage for avatar & product configurators — wire your Three.js / model-viewer scene here.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
