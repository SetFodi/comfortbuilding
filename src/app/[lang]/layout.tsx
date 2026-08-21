import type { Metadata } from "next";
import {
  Noto_Sans_Georgian,
  Noto_Serif,
  Noto_Serif_Georgian,
} from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContactDock } from "@/components/contact-dock";
import { getDict } from "@/lib/dictionary";
import {
  absoluteUrl,
  HOME_DESCRIPTIONS,
  languageAlternates,
  pagePath,
  SITE_URL,
} from "@/lib/seo";
import { COMPANY_NAME } from "@/lib/site";
import { isLang, LANGS } from "@/lib/types";
import "../globals.css";

const serifGeorgian = Noto_Serif_Georgian({
  variable: "--font-serif-geo",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const serifLatin = Noto_Serif({
  variable: "--font-serif-lat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sansGeorgian = Noto_Sans_Georgian({
  variable: "--font-sans-geo",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

interface LocaleLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { lang: candidate } = await params;
  const lang = isLang(candidate) ? candidate : "ka";

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Comfort Building",
    title: {
      default: COMPANY_NAME[lang],
      template: `%s — ${COMPANY_NAME[lang]}`,
    },
    description: HOME_DESCRIPTIONS[lang],
    alternates: languageAlternates(lang),
    category: "construction and real estate",
    creator: COMPANY_NAME[lang],
    publisher: COMPANY_NAME[lang],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(pagePath(lang)),
      siteName: COMPANY_NAME[lang],
      title: COMPANY_NAME[lang],
      description: HOME_DESCRIPTIONS[lang],
      locale: lang === "ka" ? "ka_GE" : lang === "ru" ? "ru_RU" : "en_US",
      alternateLocale: ["ka_GE", "en_US", "ru_RU"].filter(
        (locale) =>
          locale !==
          (lang === "ka" ? "ka_GE" : lang === "ru" ? "ru_RU" : "en_US"),
      ),
      images: [
        {
          url: absoluteUrl(
            "/images/experimental-ai/comfort-house-golden-hour.png",
          ),
          width: 1517,
          height: 1037,
          alt: COMPANY_NAME[lang],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: COMPANY_NAME[lang],
      description: HOME_DESCRIPTIONS[lang],
      images: [
        absoluteUrl("/images/experimental-ai/comfort-house-golden-hour.png"),
      ],
    },
  };
}

export default async function LocaleRootLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { lang: candidate } = await params;
  if (!isLang(candidate)) notFound();

  const dict = getDict(candidate);

  return (
    <html
      lang={candidate}
      data-scroll-behavior="smooth"
      className={`${serifGeorgian.variable} ${serifLatin.variable} ${sansGeorgian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-16 lg:pb-0">
        <a href="#main-content" className="skip-link">
          {dict.misc.skipContent}
        </a>
        <Header lang={candidate} dict={dict} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer lang={candidate} dict={dict} />
        <ContactDock lang={candidate} dict={dict} />
      </body>
    </html>
  );
}
