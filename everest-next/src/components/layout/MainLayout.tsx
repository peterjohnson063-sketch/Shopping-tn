import { Footer } from "@/components/home/Footer";
import { EverestAmazonHeader } from "@/components/layout/EverestAmazonHeader";

type MainLayoutProps = {
  children: React.ReactNode;
  /** Replace the default marketplace header */
  header?: React.ReactNode;
  /** Replace the default footer */
  footer?: React.ReactNode;
  showFooter?: boolean;
  cartCount?: number;
};

export function MainLayout({
  children,
  header,
  footer,
  showFooter = true,
  cartCount
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-everest-canvas font-sans text-zinc-900 antialiased">
      <div className="sticky top-0 z-50 shrink-0">{header ?? <EverestAmazonHeader cartCount={cartCount ?? 0} />}</div>

      <main className="min-h-0 flex-1 bg-everest-canvas">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12 lg:py-8">
          {children}
        </div>
      </main>

      {showFooter ? (footer ?? <Footer />) : null}
    </div>
  );
}
