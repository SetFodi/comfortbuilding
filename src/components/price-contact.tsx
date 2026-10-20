import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";

interface PriceContactProps {
  readonly lang: Lang;
  readonly projectSlug: string;
  /** Opens the email subject line. */
  readonly projectName?: string;
  /** Used as the `data-contact-action` prefix for analytics. */
  readonly placement: string;
  /** Appended to the email subject, e.g. "Apartment №802". */
  readonly topic?: string;
  readonly tone?: "dark" | "light";
  /** "block" adds the price label and prompt above the buttons. */
  readonly variant?: "block" | "buttons";
  readonly className?: string;
}

const COPY = {
  ka: {
    label: "ფასი",
    prompt: "ფასი მოთხოვნით — დეტალებისთვის დაგვიკავშირდით.",
    call: "დაგვირეკეთ",
    email: "მოგვწერეთ",
    subject: "ფასის მოთხოვნა",
  },
  en: {
    label: "Price",
    prompt: "Price on request — contact us for more details.",
    call: "Call us",
    email: "Email us",
    subject: "price inquiry",
  },
  ru: {
    label: "Цена",
    prompt: "Цена по запросу — свяжитесь с нами для подробностей.",
    call: "Позвонить",
    email: "Написать",
    subject: "запрос цены",
  },
} as const;

/** Replaces published prices with a highlighted call action and an email action. */
export function PriceContact({
  lang,
  projectSlug,
  projectName = "Comfort House",
  placement,
  topic,
  tone = "dark",
  variant = "block",
  className = "",
}: PriceContactProps) {
  const copy = COPY[lang];
  const base = `${projectName} — ${copy.subject}`;
  const subject = topic ? `${base}, ${topic}` : base;
  const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
  const onLight = tone === "light";

  return (
    <div data-project-slug={projectSlug} className={className}>
      {variant === "block" && (
        <>
          <p
            className={`font-mono text-[9px] tracking-[0.14em] uppercase ${
              onLight ? "text-ink/45" : "text-cream/40"
            }`}
          >
            {copy.label}
          </p>
          <p
            className={`mt-2 text-sm leading-relaxed ${
              onLight ? "text-ink/70" : "text-cream/70"
            }`}
          >
            {copy.prompt}
          </p>
        </>
      )}
      <div
        className={`flex flex-wrap gap-2 ${variant === "block" ? "mt-4" : ""}`}
      >
        <a
          href={CONTACT.phoneHref}
          data-contact-action={`${placement}-call`}
          className={`inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold transition-colors ${
            onLight
              ? "bg-ink text-cream hover:bg-iron"
              : "bg-brass text-ink hover:bg-brass-bright"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4 shrink-0 fill-none stroke-current"
            strokeWidth="1.7"
          >
            <path d="M7.1 3.5 4.7 5.9c-.8.8-.8 2.1-.2 3.4a21.2 21.2 0 0 0 10.2 10.2c1.3.6 2.6.6 3.4-.2l2.4-2.4-4-3-2 2c-2.7-1.2-5.2-3.7-6.4-6.4l2-2-3-4Z" />
          </svg>
          {copy.call}
        </a>
        <a
          href={mailto}
          data-contact-action={`${placement}-email`}
          className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-colors ${
            onLight
              ? "border-ink/25 text-ink/80 hover:border-bronze hover:text-bronze"
              : "border-cream/25 text-cream/80 hover:border-brass hover:text-brass"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4 shrink-0 fill-none stroke-current"
            strokeWidth="1.7"
          >
            <rect x="3.5" y="5.5" width="17" height="13" />
            <path d="m4 6.5 8 6.5 8-6.5" />
          </svg>
          {copy.email}
        </a>
      </div>
    </div>
  );
}
