import type { MetadataRoute } from "next";

const BASE_URL = "https://civicspark.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/mission/SPARK6", "/teacher", "/bills", "/representatives", "/how-it-works"];
  return routes.map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/bills" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));
}
