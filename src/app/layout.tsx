import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tornado Academy — منصة ومجتمع تعليم الذكاء الاصطناعي العملي",
  description:
    "منصة متكاملة ومجتمع لتعليم وتوظيف الذكاء الاصطناعي في البرمجة بـ Claude Code & Codex، المونتاج، الجرافيك ديزاين، والـ Media Buying. مكتبة تتحدث يوميًا — الافتتاح 1 ديسمبر.",
  icons: {
    icon: "/brand/tornado-icon.webp",
    apple: "/brand/tornado-icon.webp",
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
