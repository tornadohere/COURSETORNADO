import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/en", "/ai-news", "/en/ai-news", "/vault", "/en/vault"];
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route.includes("ai-news") ? "hourly" : "weekly",
    priority: route === "/" || route === "/en" ? 1 : 0.8,
  }));
}
