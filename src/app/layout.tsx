import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";
import { fontVariables } from "./fonts";
import "./globals.css";

const DEFAULT_TITLE =
  "Tornado Academy — منصة ومجتمع تعليم الذكاء الاصطناعي العملي";
const DEFAULT_DESCRIPTION =
  "منصة متكاملة ومجتمع لتعليم وتوظيف الذكاء الاصطناعي في البرمجة بـ Claude Code & Codex، المونتاج، الجرافيك ديزاين، والـ Media Buying. مكتبة تتحدث يوميًا — الافتتاح 1 ديسمبر.";

export const viewport: Viewport = {
  themeColor: "#050608",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og/og-ar.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og/og-ar.jpg"],
  },
  icons: {
    icon: [
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/tornado-icon.webp", type: "image/webp" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
