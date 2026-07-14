import { STATS } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { Reveal } from "./reveal";

const STAGGER_STEP_MS = 90;

export function StatBand({ lang }: { readonly lang: Lang }) {
  return (
    <section className="border-y border-cream/10 bg-basalt">
      <div className="wrap">
        <div className="grid grid-cols-2 overflow-hidden lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal
              key={stat.value + index}
              delayMs={index * STAGGER_STEP_MS}
              className="-mt-px -ml-px border-t border-l border-cream/10 px-6 py-10"
            >
              <div className="font-mono text-4xl text-brass md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-3 text-[13px] leading-snug text-cream/65">
                {stat.label[lang]}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
