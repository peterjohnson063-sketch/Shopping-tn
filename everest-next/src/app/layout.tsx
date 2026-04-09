import type { Metadata } from "next";
import "./globals.css";
import ModelViewerScript from "@/components/model-viewer-script";

export const metadata: Metadata = {
  title: "Everest Marketplace",
  description: "Luxury custom furniture marketplace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ModelViewerScript />
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
