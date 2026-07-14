import type { NextConfig } from "next";

const LEGACY_PROJECTS = [
  { old: "komfort-hausi", current: "comfort-house" },
  { old: "COMFORT-HOUSE-", current: "comfort-house" },
  { old: "tvinsi-", current: "twins" },
  { old: "TWINS", current: "twins" },
  { old: "TWINS-", current: "twins" },
  { old: "grand-hausi-tbilisi", current: "grand-house-tbilisi" },
  { old: "grand-xaus-tbilisi", current: "grand-house-tbilisi" },
  { old: "GRAND-HOUSE-TBILISI", current: "grand-house-tbilisi" },
  { old: "red-laini", current: "red-line" },
  { old: "RED-LINE", current: "red-line" },
  { old: "RED-LINE-", current: "red-line" },
  { old: "dom-na-parnavaza", current: "house-on-parnavaz" },
] as const;

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  async redirects() {
    const projectRedirects = LEGACY_PROJECTS.flatMap(({ old, current }) => [
      {
        source: `/project/${old}`,
        destination: `/ka/projects/${current}`,
        permanent: true,
      },
      {
        source: `/:lang(ka|en|ru)/project/${old}`,
        destination: `/:lang/projects/${current}`,
        permanent: true,
      },
      {
        source: `/public/:lang(ka|en|ru)/project/${old}`,
        destination: `/:lang/projects/${current}`,
        permanent: true,
      },
    ]);

    return [
      { source: "/company", destination: "/ka/about", permanent: true },
      {
        source: "/:lang(ka|en|ru)/company",
        destination: "/:lang/about",
        permanent: true,
      },
      { source: "/projects", destination: "/ka/projects", permanent: true },
      {
        source: "/projects/:status(ongoing|completed|future)",
        destination: "/ka/projects",
        permanent: true,
      },
      {
        source: "/:lang(ka|en|ru)/projects/:status(ongoing|completed|future)",
        destination: "/:lang/projects",
        permanent: true,
      },
      { source: "/contact", destination: "/ka/contact", permanent: true },
      { source: "/news/:path*", destination: "/ka", permanent: true },
      {
        source: "/:lang(ka|en|ru)/news/:path*",
        destination: "/:lang",
        permanent: true,
      },
      ...projectRedirects,
      {
        source: "/public/:lang(ka|en|ru)/project/:path*",
        destination: "/:lang/projects",
        permanent: true,
      },
      {
        source: "/:lang(ka|en|ru)/project/:path*",
        destination: "/:lang/projects",
        permanent: true,
      },
      {
        source: "/project/:path*",
        destination: "/ka/projects",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
