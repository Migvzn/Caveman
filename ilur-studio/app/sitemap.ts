import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/mentions-legales", "/cgv"].map((p) => ({ url: `${site.url}${p}`, lastModified: new Date() }));
  return [...pages, ...products.map((p) => ({ url: `${site.url}/shop/${p.slug}`, lastModified: new Date(p.releasedAt) }))];
}
