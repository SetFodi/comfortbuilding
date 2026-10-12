import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { LeadInquiryForm } from "@/components/lead-inquiry-form";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getDict } from "@/lib/dictionary";
import { PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import {
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  SITE_URL,
  webPageJsonLd,
} from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const TITLE: Localized = {
  ka: "დავიწყოთ საუბრით",
  en: "Let’s start with a conversation",
  ru: "Начнём с разговора",
};

const LEDE: Localized = {
  ka: "დაგვიკავშირდით პირდაპირ — ტელეფონით, ელფოსტით ან სოციალური ქსელებით. პასუხს მიიღებთ კომპანიის გუნდისგან.",
  en: "Contact the company directly by phone, email, or social media and speak with its team.",
  ru: "Свяжитесь с компанией напрямую по телефону, электронной почте или в социальных сетях.",
};

const OFFICE: Localized = {
  ka: "ბათუმის ოფისი",
  en: "Batumi office",
  ru: "Офис в Батуми",
};

const PHONE: Localized = { ka: "ტელეფონი", en: "Phone", ru: "Телефон" };

const HERO_ALT: Localized = {
  ka: "კომფორტ ჰაუსი საღამოს",
  en: "Comfort House in the evening",
  ru: "Комфорт Хаус вечером",
};

const HERO_IMAGE = {
  src: "/images/projects/comfort-house/evening.jpg",
  width: 1920,
  height: 1329,
  alt: HERO_ALT,
} as const;

const META_TITLE: Localized = {
  ka: "კონტაქტი — ბინები და პროექტები ბათუმში",
  en: "Contact — apartments and projects in Batumi",
  ru: "Контакты — квартиры и проекты в Батуми",
};

interface ContactPageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(params: ContactPageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang,
    title: META_TITLE[lang],
    description: LEDE[lang],
    suffix: "/contact",
    image: HERO_IMAGE,
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapQuery)}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&output=embed`;
  const inquiryProjects = PROJECTS.map((project) => ({
    slug: project.slug,
    name: project.name[lang],
    apartments: (project.inventory?.floors ?? []).flatMap((floor) => floor.units)
      .filter((unit) => unit.kind === "apartment" && unit.status === "available" && unit.number)
      .map((unit) => ({ id: unit.id, number: unit.number! })),
  }));

  const details = [
    {
      label: PHONE[lang],
      value: CONTACT.phoneDisplay,
      href: CONTACT.phoneHref,
    },
    {
      label: "Email",
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
    },
    {
      label: OFFICE[lang],
      value: CONTACT.address[lang],
      href: mapUrl,
    },
  ];

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            ...webPageJsonLd(
              lang,
              "/contact",
              META_TITLE[lang],
              LEDE[lang],
              "ContactPage",
            ),
            mainEntity: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([
            { name: dict.nav.home, path: pagePath(lang) },
            { name: dict.nav.contact, path: pagePath(lang, "/contact") },
          ]),
        ])}
      />
      <PageHero
        eyebrow={dict.nav.contact}
        title={TITLE[lang]}
        lede={LEDE[lang]}
        image={HERO_IMAGE.src}
        imageAlt={HERO_ALT[lang]}
        annotation="DIRECT CONTACT / BATUMI / GEORGIA"
      />

      <LeadInquiryForm
        lang={lang}
        projects={inquiryProjects}
      />

      <section className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-light">{dict.sections.contact}</p>
            <div className="mt-8 border-t border-ink/20">
              {details.map((detail, index) => (
                <Reveal key={detail.label} delayMs={index * 80}>
                  <div className="border-b border-ink/20 py-7">
                    <p className="font-mono text-[11px] tracking-[0.16em] text-ink/65 uppercase">
                      {detail.label}
                    </p>
                    <a
                      href={detail.href}
                      target={
                        detail.href.startsWith("https") ? "_blank" : undefined
                      }
                      rel={
                        detail.href.startsWith("https")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="mt-3 inline-block max-w-full break-words font-display text-2xl leading-snug transition-colors hover:text-bronze md:text-3xl"
                    >
                      {detail.value}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center border border-ink px-5 font-mono text-xs tracking-[0.12em] uppercase transition-colors hover:bg-ink hover:text-cream"
              >
                Facebook ↗
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center border border-ink px-5 font-mono text-xs tracking-[0.12em] uppercase transition-colors hover:bg-ink hover:text-cream"
              >
                Instagram ↗
              </a>
            </div>
          </div>

          <Reveal
            className="min-h-[32rem] overflow-hidden border border-ink/20 lg:col-span-7"
            delayMs={100}
          >
            <iframe
              src={mapEmbedUrl}
              title={`${OFFICE[lang]} — ${CONTACT.address[lang]}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[32rem] w-full grayscale-[0.7]"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
