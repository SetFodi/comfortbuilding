"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackClientError } from "@/lib/analytics";
import { CONTACT } from "@/lib/site";
import { isLang, type Lang } from "@/lib/types";

const COPY = {
  ka: {
    eyebrow: "დროებითი შეფერხება",
    title: "ეს გვერდი ვერ ჩაიტვირთა",
    text: "თქვენს ბრაუზერში რაღაც შეფერხდა. სცადეთ ხელახლა; თუ არ გამოვიდა, განაახლეთ გვერდი ან დაგვირეკეთ.",
    retry: "ხელახლა ცდა",
    reload: "გვერდის განახლება",
    home: "მთავარ გვერდზე",
    call: "დარეკვა",
  },
  en: {
    eyebrow: "Temporary problem",
    title: "This page couldn't load",
    text: "Something went wrong in your browser. Try again, and if that doesn't help, reload the page or give us a call.",
    retry: "Try again",
    reload: "Reload page",
    home: "Go to home page",
    call: "Call us",
  },
  ru: {
    eyebrow: "Временный сбой",
    title: "Страница не загрузилась",
    text: "В браузере что-то пошло не так. Попробуйте ещё раз; если не поможет, обновите страницу или позвоните нам.",
    retry: "Попробовать снова",
    reload: "Обновить страницу",
    home: "На главную",
    call: "Позвонить",
  },
} as const;

/**
 * Shown inside the normal header and footer when a page fails while
 * rendering, instead of the browser's blank "Application error" screen.
 */
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const params = useParams<{ lang?: string }>();
  const lang: Lang = isLang(params?.lang ?? "") ? params!.lang as Lang : "ka";
  const copy = COPY[lang];
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    // The failure may happen far down the page; bring the message into view.
    section.current?.scrollIntoView({ block: "start" });
    console.error("[page]", error.digest ?? "", error);
    trackClientError("page", error);
  }, [error]);

  return (
    <section ref={section} role="alert" data-page-error className="draft-grid scroll-mt-24 bg-ink py-28 text-cream md:py-40">
      <div className="wrap max-w-3xl">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-5 font-display text-4xl leading-tight font-medium md:text-6xl">{copy.title}</h1>
        <p className="mt-6 max-w-xl leading-relaxed text-cream/65">{copy.text}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className="inline-flex min-h-12 items-center bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright">
            {copy.retry}
          </button>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center border border-cream/30 px-6 text-sm font-semibold text-cream transition-colors hover:border-brass hover:text-brass">
            {copy.reload}
          </button>
          <Link href={`/${lang}`} className="inline-flex min-h-12 items-center px-3 text-sm font-semibold text-cream/70 hover:text-brass">
            {copy.home} <span aria-hidden className="ml-2">→</span>
          </Link>
        </div>
        <a href={CONTACT.phoneHref} className="mt-10 inline-flex min-h-11 items-center gap-3 font-mono text-sm text-brass">
          {copy.call} · {CONTACT.phoneDisplay}
        </a>
        {error.digest && <p className="mt-6 font-mono text-[10px] text-cream/30">ID {error.digest}</p>}
      </div>
    </section>
  );
}
