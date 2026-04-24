"use client";

import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject
} from "react";
import { ChevronDown, MapPin, Menu, Search, ShoppingCart, X } from "lucide-react";

const SEARCH_CATEGORIES = [
  "All",
  "Tactical Gear",
  "Electronics",
  "Custom Furniture",
  "Apparel",
  "Home & Office"
] as const;

const SUB_NAV = [
  { label: "All", href: "/" },
  { label: "Tactical Gear", href: "/#tactical" },
  { label: "Best Sellers", href: "/#best-sellers" },
  { label: "Customer Service", href: "/#support" }
] as const;

function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler, { passive: true });
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside, active]);
}

function useCloseOnEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

export type EverestAmazonHeaderProps = {
  cartCount?: number;
  className?: string;
};

function EverestAmazonHeaderInner({ cartCount = 0, className = "" }: EverestAmazonHeaderProps) {
  const searchFormId = useId();
  const [category, setCategory] = useState<string>(SEARCH_CATEGORIES[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const closeCategory = useCallback(() => setCategoryOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const closeAll = useCallback(() => {
    setCategoryOpen(false);
    setAccountOpen(false);
    setMobileDrawer(false);
  }, []);

  useClickOutside(categoryRef, closeCategory, categoryOpen);
  useClickOutside(accountRef, closeAccount, accountOpen);
  useCloseOnEscape(categoryOpen || accountOpen || mobileDrawer, closeAll);

  useEffect(() => {
    if (!mobileDrawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDrawer]);

  return (
    <header
      className={`sticky top-0 z-50 font-sans text-white shadow-md shadow-black/20 ${className}`}
      style={{ backgroundColor: "#232F3E" }}
    >
      <div className="mx-auto max-w-[1440px] px-2 sm:px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-y-2 py-2 md:flex-nowrap md:gap-3 md:py-2.5">
          <button
            type="button"
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileDrawer}
            onClick={() => setMobileDrawer((v) => !v)}
          >
            {mobileDrawer ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md px-1 outline-none ring-everest-blue/40 focus-visible:ring-2"
            aria-label="Everest home"
          >
            <span className="text-xl font-black tracking-tight sm:text-2xl">Everest</span>
          </Link>

          <Link
            href="/#location"
            className="hidden shrink-0 flex-col leading-tight text-white hover:underline sm:flex md:max-w-[140px] lg:max-w-none"
          >
            <span className="flex items-center gap-0.5 text-xs text-white/90">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
              Deliver to
            </span>
            <span className="pl-4 text-sm font-bold">Tunisia</span>
          </Link>

          <form
            id={searchFormId}
            className="order-last flex w-full min-w-0 md:order-none md:flex-1 md:px-1"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div
              ref={categoryRef}
              className="relative flex min-w-0 flex-1 rounded-l-md border-2 border-transparent bg-white focus-within:border-everest-blue focus-within:ring-2 focus-within:ring-everest-blue/25"
            >
              <button
                type="button"
                className="flex w-[4.5rem] shrink-0 items-center justify-center gap-0.5 border-r border-zinc-300 bg-zinc-200 px-1 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-300 sm:w-28 sm:px-2"
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                aria-label="Search category"
                onClick={() => {
                  setCategoryOpen((v) => !v);
                  setAccountOpen(false);
                }}
              >
                <span className="truncate">{category}</span>
                <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden />
              </button>
              {categoryOpen && (
                <ul
                  className="absolute left-0 top-[calc(100%+4px)] z-[60] max-h-64 w-52 overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm text-zinc-900 shadow-xl"
                  role="listbox"
                >
                  {SEARCH_CATEGORIES.map((c) => (
                    <li key={c} role="option" aria-selected={c === category}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-zinc-100"
                        onClick={() => {
                          setCategory(c);
                          setCategoryOpen(false);
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
                name="q"
                placeholder="Search Everest"
                className="min-w-0 flex-1 border-0 bg-white px-2 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:px-3"
                autoComplete="off"
                aria-label="Search"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center justify-center rounded-r-md bg-everest-blue px-3 py-2 text-white transition hover:brightness-110 sm:px-5"
                aria-label="Submit search"
              >
                <Search className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
            <Link
              href="/login"
              className="rounded-md px-2 py-1 text-sm font-bold hover:bg-white/10 sm:hidden"
            >
              Sign in
            </Link>
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                className="flex flex-col items-start rounded-md px-2 py-1 text-left hover:bg-white/10"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                aria-controls="everest-account-flyout"
                id="everest-account-trigger"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setCategoryOpen(false);
                }}
              >
                <span className="text-xs text-white/80">Hello, sign in</span>
                <span className="flex items-center gap-0.5 text-sm font-bold leading-none">
                  Account &amp; Lists
                  <ChevronDown className="h-4 w-4 text-white/80" aria-hidden />
                </span>
              </button>
              {accountOpen && (
                <div
                  id="everest-account-flyout"
                  role="menu"
                  aria-labelledby="everest-account-trigger"
                  className="absolute right-0 top-full z-[60] mt-1 w-64 rounded-md border border-zinc-200 bg-white py-2 text-zinc-900 shadow-xl"
                >
                  <div className="border-b border-zinc-100 px-4 pb-3 pt-1">
                    <Link
                      href="/login"
                      className="block rounded-md bg-everest-blue py-2 text-center text-sm font-semibold text-white hover:brightness-110"
                      onClick={closeAccount}
                    >
                      Sign in
                    </Link>
                    <p className="mt-2 text-xs text-zinc-600">
                      New customer?{" "}
                      <Link href="/login" className="text-everest-blue hover:underline" onClick={closeAccount}>
                        Start here
                      </Link>
                    </p>
                  </div>
                  <div className="max-h-48 overflow-auto px-2 py-2 text-sm">
                    <p className="px-2 py-1 text-xs font-bold text-zinc-500">Your Account</p>
                    <Link href="/#account" className="block rounded px-2 py-1.5 hover:bg-zinc-100" onClick={closeAccount}>
                      Your profile
                    </Link>
                    <Link href="/#orders" className="block rounded px-2 py-1.5 hover:bg-zinc-100" onClick={closeAccount}>
                      Your orders
                    </Link>
                    <Link href="/#lists" className="block rounded px-2 py-1.5 hover:bg-zinc-100" onClick={closeAccount}>
                      Your lists
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/#orders"
              className="hidden flex-col rounded-md px-2 py-1 hover:bg-white/10 lg:flex"
            >
              <span className="text-xs text-white/80">Returns</span>
              <span className="text-sm font-bold">&amp; Orders</span>
            </Link>

            <Link
              href="/#cart"
              className="relative flex items-end gap-0.5 rounded-md p-2 hover:bg-white/10 sm:px-2"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            >
              <div className="relative">
                <ShoppingCart className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-everest-blue px-1 text-xs font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </div>
              <span className="hidden pb-0.5 text-sm font-bold leading-none lg:inline">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      <nav
        className="flex min-h-[2.5rem] items-stretch text-sm text-white"
        style={{ backgroundColor: "#37475A" }}
        aria-label="Browse categories"
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center px-2 sm:px-4 lg:px-6">
          <Link
            href="/"
            aria-label="Shop all departments"
            className="hidden items-center gap-1 rounded-sm px-2 py-2 font-medium hover:bg-white/10 md:inline-flex"
          >
            <Menu className="h-5 w-5" aria-hidden />
            All
          </Link>
          <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
            {SUB_NAV.map(({ label, href }) => (
              <li key={label} className="shrink-0">
                <Link
                  href={href}
                  className="block whitespace-nowrap rounded-sm px-2 py-2 font-medium hover:bg-white/10 md:px-3"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {mobileDrawer ? (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setMobileDrawer(false)}
        />
      ) : null}
      {mobileDrawer ? (
        <div
          className="fixed inset-y-0 left-0 z-[70] w-[min(20rem,88vw)] overflow-y-auto bg-zinc-900 p-4 text-white shadow-2xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-bold">Everest</span>
            <button
              type="button"
              className="rounded-md p-2 hover:bg-white/10"
              aria-label="Close menu"
              onClick={() => setMobileDrawer(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <Link
            href="/#location"
            className="mb-4 flex items-start gap-2 rounded-md border border-white/10 p-3 text-sm"
            onClick={() => setMobileDrawer(false)}
          >
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-everest-blue" />
            <span>
              <span className="block text-white/70">Deliver to</span>
              <span className="font-semibold">Tunisia</span>
            </span>
          </Link>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">Account</p>
          <Link
            href="/login"
            className="block rounded-md py-2 text-everest-blue hover:underline"
            onClick={() => setMobileDrawer(false)}
          >
            Sign in
          </Link>
          <hr className="my-4 border-white/10" />
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">Shop</p>
          <ul className="space-y-1">
            {SUB_NAV.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="block rounded-md py-2 hover:bg-white/10" onClick={() => setMobileDrawer(false)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}

export const EverestAmazonHeader = memo(EverestAmazonHeaderInner);
