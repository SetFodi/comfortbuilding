import type { Lang } from "./types";

export const INQUIRY_CONTEXT_EVENT = "comfortbuilding:inquiry-context";

export interface InquiryProject {
  readonly slug: string;
  readonly name: string;
  readonly apartments: readonly { readonly id: string; readonly number: string }[];
}

export function inquiryHref(lang: Lang, project?: string, apartment?: string) {
  const query = new URLSearchParams({ interest: apartment ? `apartment-${apartment}` : "apartments" });
  if (project) query.set("project", project);
  return `/${lang}/contact?${query}#inquiry`;
}

export function projectFromLocation(
  pathname: string,
  search: string,
  projectSlugs: readonly string[],
): string {
  const routeProject = pathname.match(/^\/(?:ka|en|ru)\/projects\/([^/]+)\/?$/)?.[1];
  const queryProject = new URLSearchParams(search).get("project");
  const candidate = routeProject ?? queryProject;
  return candidate && projectSlugs.includes(candidate) ? candidate : "general";
}
