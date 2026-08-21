"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/dictionary";
import { CONTACT } from "@/lib/site";
import type { Lang, Localized } from "@/lib/types";

interface ContactDockProps {
  readonly lang: Lang;
  readonly dict: Dict;
}

const INQUIRY_LABEL: Localized = {
  ka: "იკითხეთ ბინაზე",
  en: "Ask about a home",
  ru: "Спросить о квартире",
};

export function ContactDock({ lang, dict }: ContactDockProps) {
  const pathname = usePathname();
  const onContactPage = pathname === `/${lang}/contact`;

  return (
    <aside
      aria-label={dict.sections.contact}
      className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-2 border-t border-cream/15 bg-ink/95 backdrop-blur-md lg:hidden"
    >
      <a
        href={CONTACT.phoneHref}
        data-contact-action="mobile-dock-call"
        className="flex min-w-0 items-center justify-center gap-2 border-r border-cream/15 px-3 text-sm font-semibold text-cream"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4 fill-none stroke-current"
          strokeWidth="1.7"
        >
          <path d="M7.1 3.5 4.7 5.9c-.8.8-.8 2.1-.2 3.4a21.2 21.2 0 0 0 10.2 10.2c1.3.6 2.6.6 3.4-.2l2.4-2.4-4-3-2 2c-2.7-1.2-5.2-3.7-6.4-6.4l2-2-3-4Z" />
        </svg>
        {dict.cta.call}
      </a>
      {onContactPage ? (
        <a
          href={`mailto:${CONTACT.email}`}
          data-contact-action="mobile-dock-email"
          className="flex min-w-0 items-center justify-center bg-brass px-3 text-center text-sm font-semibold text-ink"
        >
          {dict.cta.write}
        </a>
      ) : (
        <Link
          href={`/${lang}/contact?interest=apartments#inquiry`}
          data-contact-action="mobile-dock-inquiry"
          className="flex min-w-0 items-center justify-center bg-brass px-3 text-center text-sm font-semibold text-ink"
        >
          {INQUIRY_LABEL[lang]}
        </Link>
      )}
    </aside>
  );
}
