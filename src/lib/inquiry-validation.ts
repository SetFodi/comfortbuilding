import type { InquiryProject } from "./inquiry-context";
import type { Lang } from "./types";

export interface ValidInquiry {
  readonly name: string;
  readonly contact: string;
  readonly message: string;
  readonly lang: Lang;
  readonly projectSlug: string;
  readonly projectName: string;
  readonly topic: "general" | "apartments" | "apartment";
  readonly apartmentNumber?: string;
  readonly requestId: string;
}

export function parseInquiry(
  input: unknown,
  projects: readonly InquiryProject[],
): { ok: true; inquiry: ValidInquiry } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid" };
  }
  const body = input as Record<string, unknown>;
  const field = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const name = field("name");
  const contact = field("contact");
  const message = field("message");
  const lang = field("lang");
  const topic = field("topic");
  const projectSlug = field("projectSlug");
  const unitId = field("unitId");
  const requestId = field("requestId");
  if (field("website") || !["ka", "en", "ru"].includes(lang)) return { ok: false, error: "invalid" };
  if (name.length < 2 || name.length > 120 || /[\r\n\u0000-\u001f]/.test(name)) return { ok: false, error: "name" };
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const digits = contact.replace(/\D/g, "");
  const phone = /^[+\d\s().-]+$/.test(contact) && digits.length >= 8 && digits.length <= 18;
  if (contact.length > 180 || /[\r\n\u0000-\u001f]/.test(contact) || (!email && !phone)) return { ok: false, error: "contact" };
  if (message.length > 3000 || message.includes("\u0000")) return { ok: false, error: "message" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return { ok: false, error: "invalid" };
  if (topic !== "general" && topic !== "apartments" && topic !== "apartment") return { ok: false, error: "invalid" };
  const project = projects.find((item) => item.slug === projectSlug);
  if (!project && projectSlug !== "general") return { ok: false, error: "project" };
  const unit = project?.apartments.find((item) => item.id === unitId);
  if ((topic === "apartment" && !unit) || (topic !== "apartment" && unitId)) return { ok: false, error: "apartment" };
  return {
    ok: true,
    inquiry: {
      name, contact, message, lang: lang as Lang, topic, projectSlug,
      projectName: project?.name ?? "General consultation",
      ...(unit ? { apartmentNumber: unit.number } : {}),
      requestId,
    },
  };
}

export function inquiryEmailText(inquiry: ValidInquiry) {
  return [
    "New inquiry from the Comfort Building website",
    `Project: ${inquiry.projectName} (${inquiry.projectSlug})`,
    `Topic: ${inquiry.topic}`,
    ...(inquiry.apartmentNumber ? [`Apartment: ${inquiry.apartmentNumber}`] : []),
    `Name: ${inquiry.name}`,
    `Phone or email: ${inquiry.contact}`,
    `Language: ${inquiry.lang}`,
    `Message:\n${inquiry.message || "No additional message."}`,
  ].join("\n\n");
}
