import Link from "next/link";
import { Github, Instagram, Linkedin } from "lucide-react";

const cols = [
  {
    title: "About Everest",
    links: [
      ["Our story", "/#footer"],
      ["Artisan network", "/#footer"],
      ["Careers", "/#footer"],
      ["Press", "/#footer"]
    ] as const
  },
  {
    title: "Customer Support",
    links: [
      ["Help center", "/#footer"],
      ["Track an order", "/#footer"],
      ["Returns", "/#footer"],
      ["Contact", "/#footer"]
    ] as const
  },
  {
    title: "Founders Club",
    links: [
      ["Membership", "/#footer"],
      ["Early access", "/#footer"],
      ["Private sales", "/#footer"],
      ["Concierge", "/#footer"]
    ] as const
  }
] as const;

export function Footer() {
  return (
    <footer id="footer" className="border-t border-white/10 bg-charcoal py-14 text-white/70">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-10">
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-everest">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Social</h3>
          <p className="mt-4 text-sm leading-relaxed">Follow Everest for drops, maker stories, and behind-the-scenes builds.</p>
          <div className="mt-5 flex gap-3">
            <a href="https://instagram.com" className="rounded-xl border border-white/15 p-2.5 text-white/80 transition hover:border-everest hover:text-everest" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://linkedin.com" className="rounded-xl border border-white/15 p-2.5 text-white/80 transition hover:border-everest hover:text-everest" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://github.com" className="rounded-xl border border-white/15 p-2.5 text-white/80 transition hover:border-everest hover:text-everest" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1440px] border-t border-white/10 px-4 pt-8 text-center text-xs text-white/40 sm:px-6 lg:px-10">
        © {new Date().getFullYear()} Everest. Premium marketplace experience — React · Tailwind · Next.js
      </div>
    </footer>
  );
}
