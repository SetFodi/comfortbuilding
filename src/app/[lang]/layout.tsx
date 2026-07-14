import type { Metadata } from "next";
import {
  Noto_Sans_Georgian,
  Noto_Serif,
  Noto_Serif_Georgian,
} from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Preloader } from "@/components/preloader";
import { getDict } from "@/lib/dictionary";
import { COMPANY_NAME } from "@/lib/site";
import { isLang, LANGS, type Lang } from "@/lib/types";
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

const DESCRIPTIONS: Record<Lang, string> = {
  ka: "სამშენებლო კომპანია ბათუმში — საცხოვრებელი პროექტების სრული არქივი, რეალური ფოტოები და საკონტაქტო ინფორმაცია.",
  en: "A construction company in Batumi — the complete residential project archive, real photography, and contact information.",
  ru: "Строительная компания в Батуми — полный архив жилых проектов, реальные фотографии и контакты.",
};

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
    metadataBase: new URL("https://comfortbuilding.ge"),
    title: {
      default: COMPANY_NAME[lang],
      template: `%s — ${COMPANY_NAME[lang]}`,
    },
    description: DESCRIPTIONS[lang],
    alternates: {
      canonical: `/${lang}`,
      languages: { ka: "/ka", en: "/en", ru: "/ru" },
    },
    openGraph: {
      type: "website",
      siteName: COMPANY_NAME[lang],
      title: COMPANY_NAME[lang],
      description: DESCRIPTIONS[lang],
      locale: lang === "ka" ? "ka_GE" : lang === "ru" ? "ru_RU" : "en_US",
      images: ["/images/experimental-ai/comfort-house-golden-hour.png"],
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
      data-preloading=""
      className={`${serifGeorgian.variable} ${serifLatin.variable} ${sansGeorgian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Preloader lang={candidate} />
        <a href="#main-content" className="skip-link">
          {dict.misc.skipContent}
        </a>
        <Header lang={candidate} dict={dict} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer lang={candidate} dict={dict} />
      </body>
    </html>
  );
}
