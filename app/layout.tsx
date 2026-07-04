import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "KoleqCost — Landed Cost & Profit Calculator for Collectors";
const description =
  "Calculate landed cost, import estimate, resale price, eBay fees, COD profit, ROI, and break-even price for collectibles in Malaysia.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#282624",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`dark koleqcost-theme ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="m-0 flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <TooltipProvider>
          <main id="root" className="flex min-h-dvh flex-1 flex-col bg-background">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
