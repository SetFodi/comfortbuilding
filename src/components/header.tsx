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
    const onScroll = () => setIsSolid(window.scrollY > SCROLL_SOLID_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer, .skip-link, [data-analytics-preferences]"),
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

  const closeMobileMenu = () => setIsMenuOpen(false);

  const navItems = [
    { href: `/${lang}/apartments`, label: dict.nav.apartments },
    { href: `/${lang}/projects`, label: dict.nav.projects },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/contact`, label: dict.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isMenuOpen
          ? "border-b border-cream/10 bg-ink"
          : isSolid
            ? "border-b border-cream/10 bg-ink/90 backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-ink/70 to-transparent"
      }`}
    >
      <div className="wrap flex h-20 items-center justify-between gap-6">
        <Link
          href={`/${lang}`}
          onClick={closeMobileMenu}
          aria-current={pathname === `/${lang}` ? "page" : undefined}
          className="flex min-h-11 min-w-11 items-center gap-3"
          aria-label="Comfort Building"
        >
          <Image
            src="/images/logo-mark.png"
            alt=""
            width={44}
            height={44}
            loading="eager"
          />
          <span className="hidden font-mono text-[11px] leading-[1.5] tracking-[0.32em] text-cream uppercase sm:block">
            Comfort
            <br />
            Building
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex xl:gap-8"
          aria-label="Main"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`link-slide inline-flex min-h-11 items-center text-sm tracking-wide ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "text-brass"
                  : "text-cream/85 hover:text-cream"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1 font-mono text-[11px] tracking-[0.14em] uppercase">
            {LANGS.map((code) => (
              <Link
                key={code}
                href={`${pathInLang(pathname, code)}${pathname === `/${lang}/contact` ? inquiryQuery : ""}`}
                onClick={closeMobileMenu}
                aria-current={code === lang ? "page" : undefined}
                className={`inline-flex size-11 items-center justify-center transition-colors ${
                  code === lang
                    ? "text-brass"
                    : "text-cream/50 hover:text-cream"
                }`}
              >
                {code}
              </Link>
            ))}
          </div>

          <a
            href={CONTACT.phoneHref}
            className="hidden min-h-11 items-center border border-cream/25 px-4 font-mono text-xs tracking-[0.08em] text-cream transition-colors hover:border-brass hover:text-brass xl:inline-flex"
          >
            {CONTACT.phoneDisplay}
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
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
          className="fixed inset-x-0 top-20 flex h-[calc(100dvh-5rem)] flex-col justify-between overflow-y-auto bg-ink px-6 pt-10 pb-12 lg:hidden"
        >
          <div className="flex flex-col gap-2">
            {[{ href: `/${lang}`, label: dict.nav.home }, ...navItems].map(
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
