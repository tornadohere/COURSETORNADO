import type { Metadata } from "next";

export const SITE_URL = "https://tornado.courses";
export const SITE_NAME = "Tornado Academy";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage: string;
  locale: "ar_EG" | "en_US";
  alt?: string;
}

/**
 * Builds consistent page-level Metadata with Open Graph and Twitter/Discord/WhatsApp
 * share cards anchored to https://tornado.courses.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogImage,
  locale,
  alt,
}: PageMetadataOptions): Metadata {
  const imageAlt = alt ?? title;
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale,
      alternateLocale: locale === "ar_EG" ? ["en_US"] : ["ar_EG"],
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
