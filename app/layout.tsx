import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

// Plus Jakarta Sans has no Cyrillic; Manrope is its close geometric cousin and covers Russian.
const jakarta = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "English",
  description: "A personal English tutor.",
  appleWebApp: { capable: true, title: "English", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14161f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body className="bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}
