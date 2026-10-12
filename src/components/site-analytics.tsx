"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  analyticsReferrer,
  configureAnalytics,
  GA_MEASUREMENT_ID,
  readAnalyticsConsent,
  trackContactEvent,
  type AnalyticsConsent,
} from "@/lib/analytics";
import { projectFromLocation } from "@/lib/inquiry-context";
import type { Lang } from "@/lib/types";

const COPY = {
  ka: {
    title: "ვებსაიტის სტატისტიკა",
    text: "თქვენი თანხმობით ვზომავთ გვერდების ნახვებს, დარეკვის ღილაკზე დაწკაპუნებებსა და გაგზავნილ მოთხოვნებს. ფორმაში შეყვანილი პირადი მონაცემები Google Analytics-ს არ გადაეცემა.",
    allow: "სტატისტიკის დაშვება", decline: "სტატისტიკის გარეშე", settings: "სტატისტიკის პარამეტრები",
  },
  en: {
    title: "Website analytics",
    text: "With your permission, we measure page views, clicks on call buttons and submitted inquiries. Personal details entered in the form are not sent to Google Analytics.",
    allow: "Allow analytics", decline: "Without analytics", settings: "Analytics preferences",
  },
  ru: {
    title: "Статистика сайта",
    text: "С вашего согласия мы измеряем просмотры страниц, нажатия на кнопку звонка и отправленные запросы. Личные данные из формы не передаются в Google Analytics.",
    allow: "Разрешить статистику", decline: "Без статистики", settings: "Настройки статистики",
  },
} as const;

export function SiteAnalytics({ lang, projectSlugs }: { readonly lang: Lang; readonly projectSlugs: readonly string[] }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [ready, setReady] = useState(false);
  const lastPage = useRef<string | null>(null);
  const copy = COPY[lang];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = readAnalyticsConsent();
      if (stored) configureAnalytics(stored);
      setConsent(stored);
      setShowPreferences(!stored);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (consent !== "granted" || lastPage.current === pathname) return;
    lastPage.current = pathname;
    window.gtag?.("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_title: document.title,
      page_referrer: analyticsReferrer(),
      project_slug: projectFromLocation(pathname, window.location.search, projectSlugs),
      site_language: lang,
      ...(process.env.NODE_ENV === "development" ? { debug_mode: true } : {}),
    });
  }, [consent, pathname, lang, projectSlugs]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const scopedProject = link.closest<HTMLElement>("[data-project-slug]")?.dataset.projectSlug;
      const project = scopedProject && projectSlugs.includes(scopedProject)
        ? scopedProject : projectFromLocation(pathname, window.location.search, projectSlugs);
      const placement = link.dataset.contactAction || "site-link";
      if (href.startsWith("tel:")) {
        trackContactEvent("phone_click", { project, language: lang, placement });
      } else {
        const target = new URL(link.href, window.location.origin);
        if (target.origin === window.location.origin && /^\/(ka|en|ru)\/contact\/?$/.test(target.pathname) && target.hash === "#inquiry") {
          trackContactEvent("inquiry_start", {
            project: projectFromLocation(target.pathname, target.search, projectSlugs), language: lang, placement,
          });
        }
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname, lang, projectSlugs]);

  function choose(value: AnalyticsConsent) {
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, value); } catch { /* The inquiry form still works when storage is unavailable. */ }
    configureAnalytics(value);
    setConsent(value);
    setShowPreferences(false);
    if (value === "denied") lastPage.current = null;
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  }

  return (
    <>
      {consent === "granted" && <Script id="comfortbuilding-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />}
      {ready && showPreferences ? (
        <section data-analytics-preferences aria-label={copy.title} className="fixed right-4 bottom-20 left-4 z-50 border border-brass/25 bg-ink p-5 text-cream shadow-2xl sm:left-auto sm:max-w-md lg:bottom-5">
          <h2 className="text-base font-semibold text-brass">{copy.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/65">{copy.text}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => choose("granted")} className="min-h-11 bg-brass px-4 text-sm font-semibold text-ink hover:bg-brass-bright">{copy.allow}</button>
            <button type="button" onClick={() => choose("denied")} className="min-h-11 px-2 text-sm text-cream/75 hover:text-cream">{copy.decline}</button>
          </div>
        </section>
      ) : ready && (
        <button data-analytics-preferences type="button" onClick={() => setShowPreferences(true)} className="mx-auto block min-h-11 px-4 py-3 text-center text-xs text-cream/50 hover:text-brass">{copy.settings}</button>
      )}
    </>
  );
}
