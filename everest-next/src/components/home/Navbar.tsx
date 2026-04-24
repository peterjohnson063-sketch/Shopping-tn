"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, Search, ShoppingCart, User } from "lucide-react";

const CATEGORIES = ["All", "Tech & Gaming", "Custom Furniture", "Signature Apparel", "Home Office"];

export function Navbar({ cartCount = 2 }: { cartCount?: number }) {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-charcoal/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-everest text-sm font-black text-white">E</span>
          <span className="hidden font-semibold tracking-tight text-white sm:inline">Everest</span>
        </Link>

        <div className="relative hidden min-w-0 flex-1 md:flex">
          <div className="flex w-full max-w-3xl overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner">
            <button
              type="button"
              className="flex shrink-0 items-center gap-1 border-r border-white/10 bg-charcoal-soft px-3 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/5"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              onClick={() => setCategoryMenuOpen((v) => !v)}
            >
              {category}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {categoryMenuOpen && (
              <ul
                className="absolute left-0 top-full z-20 mt-1 max-h-56 w-52 overflow-auto rounded-xl border border-white/10 bg-charcoal py-1 shadow-xl"
                role="listbox"
              >
                {CATEGORIES.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-everest/20"
                      onClick={() => {
                        setCategory(c);
                        setCategoryMenuOpen(false);
                      }}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              type="search"
              placeholder="Search Everest…"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="button"
              className="flex shrink-0 items-center bg-everest px-5 py-2.5 text-white transition hover:bg-everest-muted"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 md:hidden">
          <div className="flex flex-1 items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-everest" />
            <input type="search" placeholder="Search…" className="ml-2 w-full bg-transparent text-sm text-white focus:outline-none" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-xl p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </button>
          <Link
            href="/login"
            className="relative rounded-xl p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-everest px-1 text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 md:hidden"
            aria-label="Menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
