import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/dictionary";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";

interface FooterProps {
  readonly lang: Lang;
  readonly dict: Dict;
}

export function Footer({ lang, dict }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cream/10 bg-ink">
      <div className="wrap grid gap-12 py-16 md:grid-cols-3">
        <div className="flex flex-col items-start gap-5">
          <Link href={`/${lang}`} aria-label="Comfort Building">
            <Image
              src="/images/logo-mark.png"
              alt="Comfort Building"
              width={56}
              height={56}
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-cream/60">
            {dict.hero.lede}
          </p>
        </div>

        <nav
          className="flex flex-col items-start gap-3"
          aria-label="Footer"
        >
          {[
            { href: `/${lang}`, label: dict.nav.home },
            { href: `/${lang}/projects`, label: dict.nav.projects },
            { href: `/${lang}/about`, label: dict.nav.about },
            { href: `/${lang}/contact`, label: dict.nav.contact },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-slide text-sm text-cream/80 hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start gap-3 text-sm text-cream/80">
          <a href={CONTACT.phoneHref} className="font-mono text-brass">
            {CONTACT.phoneDisplay}
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="link-slide font-mono text-cream/80"
          >
            {CONTACT.email}
          </a>
          <p className="text-cream/60">{CONTACT.address[lang]}</p>
          <div className="mt-2 flex gap-5 font-mono text-[11px] tracking-[0.2em] uppercase">
            <a
              href={CONTACT.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="link-slide text-cream/70 hover:text-cream"
            >
              Facebook
            </a>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="link-slide text-cream/70 hover:text-cream"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-5 font-mono text-[11px] tracking-[0.12em] text-cream/60">
          <span>
            © {year} {dict.misc.llc}
          </span>
          <span>{dict.misc.rights}</span>
        </div>
      </div>
    </footer>
  );
}
