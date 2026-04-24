import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ModelViewerScript from "@/components/model-viewer-script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Everest Marketplace",
  description: "Luxury custom furniture marketplace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ModelViewerScript />
        {children}
      </body>
    </html>
  );
}
