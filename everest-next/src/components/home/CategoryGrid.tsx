import { Gamepad2, Home, Shirt, Sofa } from "lucide-react";

const CATS = [
  {
    title: "Tech & Gaming",
    desc: "Peripherals, desks & battlestations",
    icon: Gamepad2,
    href: "/#trending",
    gradient: "from-cyan-500/20 to-blue-600/10"
  },
  {
    title: "Custom Furniture",
    desc: "Sur mesure · oak · atelier-built",
    icon: Sofa,
    href: "/vendor",
    gradient: "from-everest/25 to-indigo-600/10"
  },
  {
    title: "Signature Apparel",
    desc: "Limited drops & Everest editions",
    icon: Shirt,
    href: "/#trending",
    gradient: "from-fuchsia-500/15 to-everest/10"
  },
  {
    title: "Home Office",
    desc: "Ergo, lighting & quiet luxury",
    icon: Home,
    href: "/#trending",
    gradient: "from-amber-500/15 to-emerald-600/10"
  }
] as const;

export function CategoryGrid() {
  return (
    <section id="categories" className="border-b border-white/10 bg-charcoal py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-everest">Shop by room</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Categories</h2>
          </div>
          <p className="max-w-md text-sm text-white/50">Curated lanes inspired by how people actually browse — fast, visual, and scannable.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map(({ title, desc, icon: Icon, href, gradient }) => (
            <a
              key={title}
              href={href}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-6 transition hover:-translate-y-0.5 hover:border-everest/40 hover:shadow-lg hover:shadow-everest/10`}
            >
              <div className="mb-4 inline-flex rounded-xl bg-charcoal/60 p-3 text-everest ring-1 ring-white/10 transition group-hover:bg-everest/20 group-hover:text-white">
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
              <span className="mt-6 inline-flex text-sm font-medium text-everest transition group-hover:translate-x-0.5">
                Shop →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
