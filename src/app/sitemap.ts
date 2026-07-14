import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";
import { LANGS } from "@/lib/types";

const BASE_URL = "https://comfortbuilding.ge";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/about", "/contact"];

  return [
    ...LANGS.flatMap((lang) =>
      staticRoutes.map((route) => ({
        url: `${BASE_URL}/${lang}${route}`,
        changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
        priority: route === "" ? 1 : 0.8,
      })),
    ),
    ...LANGS.flatMap((lang) =>
      PROJECTS.map((project) => ({
        url: `${BASE_URL}/${lang}/projects/${project.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ),
  ];
}
