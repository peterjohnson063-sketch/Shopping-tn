/** Ivory dashboard / inner pages — full-width home bypasses this. */
export function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-ivory px-6 py-10 text-zinc-900 antialiased">
      {children}
    </main>
  );
}
