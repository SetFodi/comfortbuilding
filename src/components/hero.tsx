import type { Dict } from "@/lib/dictionary";
import { projectFloors } from "@/lib/projects";
import type { Lang, Project, SiteImage } from "@/lib/types";
import { HeroProjectCarousel } from "./hero-project-carousel";

export const DUSK_COVER: SiteImage = {
  src: "/images/experimental-ai/parnavaz-65-dusk.webp", width: 1672, height: 941,
  alt: {
    ka: "ფარნავაზ მეფის ქუჩის კუთხეში მდებარე სახლის საღამოს ვიზუალიზაცია",
    en: "Dusk visualization of the balconies on the corner of 65 Parnavaz Mepe Street",
    ru: "Вечерняя визуализация дома на углу улицы Парнаваз Мепе, 65",
  },
};

const COPY = {
  en: {
    parnavaz: ["Parnavaz Mepe", "Sixty Five."], comfort: ["Comfort", "House."],
    location: "Residences in Batumi", explore: "Explore residence", scroll: "Scroll",
    browse: "All projects", film: "Watch project film",
  },
  ka: {
    parnavaz: ["ფარნავაზ მეფის", "№65"], comfort: ["კომფორტ", "ჰაუსი"],
    location: "საცხოვრებელი სახლები ბათუმში", explore: "პროექტის ნახვა", scroll: "ქვემოთ",
    browse: "ყველა პროექტი", film: "პროექტის ვიდეო",
  },
  ru: {
    parnavaz: ["Парнаваз Мепе", "№65"], comfort: ["Комфорт", "Хаус"],
    location: "Жилые дома в Батуми", explore: "Открыть проект", scroll: "Вниз",
    browse: "Все проекты", film: "Смотреть фильм о проекте",
  },
} as const;

export function Hero({ lang, dict, projects, heading }: {
  readonly lang: Lang;
  readonly dict: Dict;
  readonly projects: readonly Project[];
  readonly heading: string;
}) {
  const copy = COPY[lang];
  const slides = projects
    .filter(({ slug }) => slug === "parnavaz-65" || slug === "comfort-house")
    .map((project) => {
      const isParnavaz = project.slug === "parnavaz-65";
      const image = isParnavaz ? DUSK_COVER : project.heroImage ?? project.cover;
      return {
        slug: project.slug, href: `/${lang}/projects/${project.slug}`, name: project.name[lang],
        title: isParnavaz ? copy.parnavaz : copy.comfort,
        city: project.city[lang], address: project.address[lang], status: dict.status[project.status],
        floors: projectFloors(project, dict.misc.tba),
        image: { src: image.src, alt: image.alt[lang] },
        mobileImage: isParnavaz ? "/images/experimental-ai/parnavaz-65-dusk-mobile.webp" : project.heroImageMobile?.src,
        film: project.heroVideo?.src,
      };
    });

  return <HeroProjectCarousel projects={slides} labels={{
    ...copy, heading, projects: dict.nav.projects, close: dict.misc.close,
  }} />;
}
