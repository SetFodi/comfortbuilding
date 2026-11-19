"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/dictionary";
import { CONTACT } from "@/lib/site";
import { INQUIRY_CONTEXT_EVENT, projectFromLocation } from "@/lib/inquiry-context";
import { LANGS, type Lang } from "@/lib/types";

interface HeaderProps {
  readonly lang: Lang;
  readonly dict: Dict;
  readonly projectSlugs: readonly string[];
}

const SCROLL_SOLID_THRESHOLD = 24;
const MOBILE_NAV_ID = "mobile-navigation";

function pathInLang(pathname: string, target: Lang): string {
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");
  return rest ? `/${target}/${rest}` : `/${target}`;
}

export function Header({ lang, dict, projectSlugs }: HeaderProps) {
  const pathname = usePathname();
  const [isSolid, setIsSolid] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mast = useRef<HTMLElement>(null);
  const languageMenu = useRef<HTMLDetailsElement>(null);
  const [inquiryQuery, setInquiryQuery] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const updateContext = () => {
      if (pathname !== `/${lang}/contact`) {
        setInquiryQuery("");
        return;
      }
      const current = new URLSearchParams(window.location.search);
      const query = new URLSearchParams();
      const project = projectFromLocation(pathname, window.location.search, projectSlugs);
      if (project !== "general") query.set("project", project);
      const interest = current.get("interest");
      if (interest && /^(?:general|apartments|apartment-\d+)$/.test(interest)) {
        query.set("interest", interest);
      }
      setInquiryQuery(query.size ? `?${query}${window.location.hash === "#inquiry" ? "#inquiry" : ""}` : "");
    };
    const frame = requestAnimationFrame(updateContext);
    window.addEventListener(INQUIRY_CONTEXT_EVENT, updateContext);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(INQUIRY_CONTEXT_EVENT, updateContext);
    };
  }, [pathname, lang, projectSlugs]);

  useEffect(() => {
    const cover = pathname === `/${lang}` ? document.getElementById("featured-residences") : null;
    const onScroll = () => setIsSolid(cover
      ? cover.getBoundingClientRect().bottom <= (mast.current?.offsetHeight ?? 0)
      : window.scrollY > SCROLL_SOLID_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [lang, pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer, aside[aria-label], .skip-link, [data-analytics-preferences]"),
    );
    const previousInert = inertTargets.map((element) => element.inert);
    const focusFrame = window.requestAnimationFrame(() => {
      firstMobileLinkRef.current?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.body.style.overflow = "hidden";
    inertTargets.forEach((element) => {
      element.inert = true;
    });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      inertTargets.forEach((element, index) => {
        element.inert = previousInert[index];
      });
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (languageMenu.current && !languageMenu.current.contains(event.target as Node)) {
        languageMenu.current.open = false;
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && languageMenu.current?.open) {
        languageMenu.current.open = false;
        languageMenu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const closeMobileMenu = () => setIsMenuOpen(false);

  const navItems = [
    { href: `/${lang}/projects`, label: dict.nav.projects },
    { href: `/${lang}/apartments`, label: dict.nav.apartments },
    { href: `/${lang}/about`, label: dict.nav.about },
  ];
  const contactLabel = { en: "Get in touch", ka: "დაგვიკავშირდით", ru: "Связаться" }[lang];

  return (
    <header ref={mast} className="site-mast" data-solid={isSolid || isMenuOpen || pathname === `/${lang}/projects`}
      data-paper={isSolid || isMenuOpen || pathname === `/${lang}/projects`}>
      <div className="wrap mast-row">
        <Link href={`/${lang}`} onClick={closeMobileMenu} aria-label="Comfort Building" className="mast-brand">
          <Image src="/images/logo-mark.png" alt="" width={45} height={45} loading="eager" />
          <span>Comfort<br />Building</span>
        </Link>
        <nav className="mast-nav" aria-label={dict.misc.menu}>
          {[{ href: `/${lang}`, label: dict.nav.home }, ...navItems].map((item) => (
            <Link key={item.href} href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              data-current={pathname === item.href || (item.href !== `/${lang}` && pathname.startsWith(`${item.href}/`))}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mast-actions">
          <details ref={languageMenu} className="mast-language" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
          }}>
            <summary aria-label={{ ka: "ენის არჩევა", en: "Choose language", ru: "Выбрать язык" }[lang]}>
              <span>{lang.toUpperCase()}</span><span className="language-chevron" aria-hidden />
            </summary>
            <div className="language-options">
              {LANGS.map((code) => (
                <Link key={code} href={`${pathInLang(pathname, code)}${pathname === `/${lang}/contact` ? inquiryQuery : ""}`}
                  lang={code} hrefLang={code} aria-current={code === lang ? "true" : undefined}
                  onClick={() => { closeMobileMenu(); if (languageMenu.current) languageMenu.current.open = false; }}>
                  {{ ka: "ქართული", en: "English", ru: "Русский" }[code]}
                </Link>
              ))}
            </div>
          </details>
          <Link href={`/${lang}/contact`} className="mast-contact">{contactLabel}<span aria-hidden>↗</span></Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => { if (languageMenu.current) languageMenu.current.open = false; setIsMenuOpen((open) => !open); }}
            aria-expanded={isMenuOpen}
            aria-controls={MOBILE_NAV_ID}
            aria-label={isMenuOpen ? dict.misc.close : dict.misc.menu}
            className="flex size-11 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              aria-hidden
              className={`h-px w-6 bg-cream transition-transform ${
                isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              aria-hidden
              className={`h-px w-6 bg-cream transition-transform ${
                isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          id={MOBILE_NAV_ID}
          aria-label="Mobile"
          className="fixed inset-x-0 top-full flex h-[calc(100dvh-var(--mast-height))] flex-col justify-between overflow-y-auto bg-ink px-6 pt-10 pb-12 lg:hidden"
        >
          <div className="flex flex-col gap-2">
            {[{ href: `/${lang}`, label: dict.nav.home }, ...navItems, { href: `/${lang}/contact`, label: dict.nav.contact }].map(
              (item, index) => (
                <Link
                  ref={index === 0 ? firstMobileLinkRef : undefined}
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="border-b border-cream/10 py-4 font-display text-3xl text-cream"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={CONTACT.phoneHref}
              onClick={closeMobileMenu}
              className="inline-flex min-h-11 items-center font-mono text-lg text-brass"
            >
              {CONTACT.phoneDisplay}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              onClick={closeMobileMenu}
              className="inline-flex min-h-11 items-center font-mono text-sm text-cream/70"
            >
              {CONTACT.email}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
