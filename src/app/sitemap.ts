import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";
import { absoluteUrl, pagePath, SITE_UPDATED_AT } from "@/lib/seo";
import { LANGS } from "@/lib/types";

function alternates(suffix = "") {
  return {
    languages: {
      ...Object.fromEntries(
        LANGS.map((lang) => [lang, absoluteUrl(pagePath(lang, suffix))]),
      ),
      "x-default": absoluteUrl(pagePath("ka", suffix)),
    },
  };
}

const STATIC_ROUTES = [
  {
    suffix: "",
    changeFrequency: "weekly" as const,
    priority: 1,
    images: PROJECTS.map((project) =>
      absoluteUrl((project.listingImage ?? project.cover).src),
    ),
  },
  {
    suffix: "/projects",
    changeFrequency: "weekly" as const,
    priority: 0.9,
    images: PROJECTS.map((project) =>
      absoluteUrl((project.listingImage ?? project.cover).src),
    ),
  },
  {
    suffix: "/about",
    changeFrequency: "monthly" as const,
    priority: 0.7,
    images: [absoluteUrl("/images/projects/grand-house/construction.jpg")],
  },
  {
    suffix: "/contact",
    changeFrequency: "monthly" as const,
    priority: 0.8,
    images: [absoluteUrl("/images/projects/comfort-house/evening.jpg")],
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...LANGS.flatMap((lang) =>
      STATIC_ROUTES.map((route) => ({
        url: absoluteUrl(pagePath(lang, route.suffix)),
        lastModified: SITE_UPDATED_AT,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: alternates(route.suffix),
        images: [...route.images],
      })),
    ),
    ...LANGS.flatMap((lang) =>
      PROJECTS.map((project) => {
        const suffix = `/projects/${project.slug}`;
        const images = Array.from(
          new Set([
            (project.heroImage ?? project.listingImage ?? project.cover).src,
            ...project.gallery.map((image) => image.src),
            ...(project.inventory?.floors.map((floor) => floor.image.src) ??
              []),
          ]),
        ).map(absoluteUrl);

        return {
          url: absoluteUrl(pagePath(lang, suffix)),
          lastModified: SITE_UPDATED_AT,
          changeFrequency: "monthly" as const,
          priority: project.status === "ongoing" ? 0.9 : 0.75,
          alternates: alternates(suffix),
          images,
        };
      }),
    ),
  ];
}
