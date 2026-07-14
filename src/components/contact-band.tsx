import type { Dict } from "@/lib/dictionary";
import { CONTACT } from "@/lib/site";
import type { Lang, Localized } from "@/lib/types";
import { Reveal } from "./reveal";

const PHONE_LABEL: Localized = {
  ka: "ტელეფონი",
  en: "Phone",
  ru: "Телефон",
};

interface ContactBandProps {
  readonly lang: Lang;
  readonly dict: Dict;
}

export function ContactBand({ lang, dict }: ContactBandProps) {
  const rows = [
    {
      label: dict.titleBlock.location,
      value: <span className="text-cream/85">{CONTACT.address[lang]}</span>,
    },
    {
      label: PHONE_LABEL[lang],
      value: (
        <a
          href={CONTACT.phoneHref}
          className="font-mono text-xl text-brass md:text-2xl"
        >
          {CONTACT.phoneDisplay}
        </a>
      ),
    },
    {
      label: "Email",
      value: (
        <a
          href={`mailto:${CONTACT.email}`}
          className="link-slide font-mono text-cream/85"
        >
          {CONTACT.email}
        </a>
      ),
    },
    {
      label: dict.misc.followUs,
      value: (
        <span className="flex gap-5 font-mono text-xs tracking-[0.2em] uppercase">
          <a
            href={CONTACT.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="link-slide text-cream/80"
          >
            Facebook
          </a>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="link-slide text-cream/80"
          >
            Instagram
          </a>
        </span>
      ),
    },
  ];

  return (
    <section className="bg-ink py-24 md:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <p className="eyebrow">{dict.sections.contact}</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight font-medium text-cream md:text-5xl">
            {dict.cta.interested}
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-cream/70">
            {dict.cta.interestedLede}
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href={CONTACT.phoneHref}
              className="inline-flex h-12 items-center gap-3 bg-brass px-7 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-brass-bright"
            >
              {dict.cta.call}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-flex h-12 items-center gap-3 border border-cream/30 px-7 text-sm font-medium tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
            >
              {dict.cta.write}
            </a>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delayMs={140}>
          <dl>
            {rows.map((row) => (
              <div
                key={row.label}
                className="border-t border-cream/12 py-5 last:border-b"
              >
                <dt className="font-mono text-[10px] tracking-[0.24em] text-cream/60 uppercase">
                  {row.label}
                </dt>
                <dd className="mt-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
