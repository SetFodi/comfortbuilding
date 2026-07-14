import Link from "next/link";
import { LANGS } from "@/lib/types";

export default function NotFound() {
  return (
    <section className="draft-grid flex min-h-[75svh] items-center bg-ink pt-28">
      <div className="wrap py-20">
        <p className="font-mono text-sm tracking-[0.2em] text-brass">ERROR / 404</p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] font-medium text-cream">
          Page not found
        </h1>
        <p className="mt-7 max-w-xl leading-relaxed text-cream/70">
          გვერდი ვერ მოიძებნა · Страница не найдена
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          {LANGS.map((lang) => (
            <Link
              key={lang}
              href={`/${lang}`}
              className="inline-flex min-h-11 items-center border border-cream/25 px-5 font-mono text-xs tracking-[0.14em] text-cream uppercase transition-colors hover:border-brass hover:text-brass"
            >
              {lang} · Home
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
