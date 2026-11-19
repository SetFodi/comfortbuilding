import Image from "next/image";

interface PageHeroProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly annotation?: string;
}

export function PageHero({ eyebrow, title, lede, image, imageAlt, annotation }: PageHeroProps) {
  return (
    <section className="page-cover">
      <div className="page-cover-photo">
        <Image src={image} alt={imageAlt} fill sizes="100vw" fetchPriority="high" loading="eager" className="object-cover" />
      </div>
      <div className="project-cover-shade" aria-hidden />
      <div className="wrap page-cover-body">
        <p className="section-kicker"><i aria-hidden />{eyebrow}</p>
        <h1 className="project-cover-title">{title}</h1>
        <div className="page-cover-foot">
          <p>{lede}</p>
          {annotation && <span>{annotation}</span>}
        </div>
      </div>
    </section>
  );
}
