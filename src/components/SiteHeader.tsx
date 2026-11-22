"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";

const NAV_ITEMS = [
  { ar: "المسارات", en: "Tracks", href: "#identity", tone: "services" },
  { ar: "الكورسات", en: "Courses", href: "#tools", tone: "work" },
  { ar: "خزنة تورنادو", en: "Free Vault", href: "#vault", tone: "process" },
  { ar: "الاشتراك", en: "Pricing", href: "#pricing", tone: "about" },
  { ar: "احجز مقعدك", en: "Waitlist", href: "#why-wait", tone: "contact" },
] as const;

function BrandWordmark() {
  const isEn = useLanguage() === "en";
  return (
    <Link
      href={isEn ? "/en" : "/"}
      className="brand"
      aria-label={isEn ? "Tornado Academy — Home" : "Tornado Academy — الرئيسية"}
    >
      <span className="brand-symbol brand-tornado-badge" aria-hidden="true">
        <Image
          src="/brand/tornado-icon.webp"
          width={40}
          height={40}
          alt=""
          sizes="40px"
          loading="eager"
          unoptimized
        />
      </span>
      <span>Tornado Academy</span>
    </Link>
  );
}

export function SiteHeader({ editorial = false }: { editorial?: boolean }) {
  const isEn = useLanguage() === "en";
  const pathname = usePathname() || "/";
  const isSubpage =
    pathname.includes("/projects/") ||
    pathname.includes("/courses/") ||
    pathname.includes("/vault") ||
    pathname.includes("/ai-news");
  const isVaultPage = pathname.includes("/vault");
  const prefix = isSubpage ? (isEn ? "/en" : "/") : "";
  const switchHref = isEn
    ? pathname.replace(/^\/en(?=\/|$)/, "") || "/"
    : `/en${pathname === "/" ? "" : pathname}`;

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-20% 0px -55% 0px" }
    );

    for (const item of NAV_ITEMS) {
      const el = document.querySelector(item.href);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`site-header${editorial ? " editorial-header" : ""}${
        isScrolled ? " is-scrolled" : ""
      }`}
    >
      <div className="header-inner shell">
        <BrandWordmark />
        <nav
          className="desktop-navigation"
          aria-label={isEn ? "Main navigation" : "القائمة الرئيسية"}
        >
          {NAV_ITEMS.map((item) => {
            const label = isEn ? item.en : item.ar;
            const resolvedHref =
              item.href === "#vault" && isVaultPage
                ? isEn
                  ? "/en/vault"
                  : "/vault"
                : `${prefix}${item.href}`;
            const isCurrent =
              (item.href === "#vault" && isVaultPage) ||
              (!prefix && activeHash === item.href);
            return (
              <a
                key={item.href}
                className={`nav-link notch-app notch-app-${item.tone}`}
                href={resolvedHref}
                aria-label={label}
                aria-current={isCurrent ? "location" : undefined}
              >
                <span className="notch-app-tile">
                  <Image
                    src={`/brand/navigation/${item.tone}-v2.webp`}
                    width={44}
                    height={44}
                    alt=""
                    sizes="44px"
                    loading="eager"
                    unoptimized
                  />
                </span>
                <span className="notch-tooltip" aria-hidden="true">
                  {label}
                </span>
              </a>
            );
          })}
        </nav>
        <Link
          className="notch-language"
          href={switchHref}
          hrefLang={isEn ? "ar" : "en"}
          lang={isEn ? "ar" : "en"}
          aria-label={isEn ? "التبديل إلى العربية" : "Switch to English"}
        >
          {isEn ? "ع" : "EN"}
        </Link>
      </div>
    </header>
  );
}
