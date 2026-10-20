import { createHash } from "node:crypto";
import { Resend } from "resend";
import { PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import { inquiryEmailText, parseInquiry } from "@/lib/inquiry-validation";
import { inquiryApartments } from "@/lib/inquiry-context";

export const runtime = "nodejs";
export const maxDuration = 15;

const MAX_BODY_BYTES = 16_384;
const WINDOW_MS = 10 * 60 * 1000;
// Instance-local backstop. Origin checks, a honeypot, a fixed recipient and the
// provider's quota also apply; this is not a distributed rate limiter.
const attempts = new Map<string, { count: number; expires: number }>();

function response(error: string, status: number) {
  return Response.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

function allowedOrigin(origin: string | null) {
  const allowed = new Set(["https://www.comfortbuilding.ge", "https://comfortbuilding.ge"]);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (process.env.NODE_ENV === "development") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3001");
  }
  return origin !== null && allowed.has(origin);
}

async function readBody(request: Request) {
  if (!request.body) throw new Error("empty");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

export async function POST(request: Request) {
  if (!allowedOrigin(request.headers.get("origin"))) return response("origin", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return response("invalid", 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return response("invalid", 413);

  let body: unknown;
  try { body = await readBody(request); } catch { return response("invalid", 400); }
  const lang = (body as { lang?: string } | null)?.lang;
  const projects = PROJECTS.map((project) => ({
    slug: project.slug,
    name: project.name[lang === "ka" || lang === "ru" ? lang : "en"],
    apartments: inquiryApartments(project),
  }));
  const parsed = parseInquiry(body, projects);
  if (!parsed.ok) return response(parsed.error, 400);

  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  // Vercel supplies this header; raw IPs and form contents are never logged.
  const ip = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "local";
  const key = createHash("sha256").update(ip).digest("hex");
  const entry = attempts.get(key) ?? { count: 0, expires: now + WINDOW_MS };
  if (entry.count >= 5 || attempts.size >= 10_000) return response("rate_limit", 429);
  entry.count += 1;
  attempts.set(key, entry);

  if (!process.env.RESEND_API_KEY) return response("unavailable", 503);
  const inquiry = parsed.inquiry;
  const testing = process.env.NODE_ENV === "development" && process.env.INQUIRY_TEST_MODE === "true";
  try {
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "Comfort Building <inquiries@mail.comfortbuilding.ge>",
      to: testing ? "delivered@resend.dev" : CONTACT.email,
      subject: `Website inquiry: ${inquiry.projectName}${inquiry.apartmentNumber ? ` / Apartment ${inquiry.apartmentNumber}` : ""}`,
      text: inquiryEmailText(inquiry),
      ...(inquiry.contact.includes("@") ? { replyTo: inquiry.contact } : {}),
      tags: [{ name: "source", value: "website_inquiry" }, { name: "project", value: inquiry.projectSlug }],
    }, { idempotencyKey: `inquiry/${inquiry.requestId}`, signal: AbortSignal.timeout(10_000) });
    if (result.error || !result.data?.id) {
      console.error("Inquiry email rejected", result.error?.name ?? "missing_id");
      return response("unavailable", 503);
    }
    return Response.json({
      ok: true, projectSlug: inquiry.projectSlug,
      ...(inquiry.apartmentNumber ? { apartmentNumber: inquiry.apartmentNumber } : {}),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Inquiry email request failed");
    return response("unavailable", 503);
  }
}
