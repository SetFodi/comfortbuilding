import type { Localized, LocalizedList } from "./types";

/** Contact details as published on comfortbuilding.ge/contact. */
export const CONTACT = {
  phoneDisplay: "+995 555 92 20 20",
  phoneHref: "tel:+995555922020",
  email: "comfbuilding@gmail.com",
  address: {
    ka: "ქ. ბათუმი, ე. თაყაიშვილის ქ. №51-53",
    en: "51-53 E. Takaishvili St., Batumi, Georgia",
    ru: "г. Батуми, ул. Э. Такаишвили №51-53",
  } satisfies Localized,
  mapQuery: "Takaishvili Street 51, Batumi, Georgia",
  facebook: "https://www.facebook.com/profile.php?id=100087434806192",
  instagram: "https://www.instagram.com/comfbuilding/",
} as const;

export const COMPANY_NAME: Localized = {
  ka: "კომფორტ ბილდინგი",
  en: "Comfort Building",
  ru: "Комфорт Билдинг",
};

/** Company story, from the About page of comfortbuilding.ge. */
export const COMPANY_STORY: LocalizedList = {
  ka: [
    "შპს „კომფორტ ბილდინგი“ წარმოადგენს სამშენებლო კომპანიას, რომელიც ახორციელებს წარმატებულ საქმიანობას ქალაქ ბათუმში. კომპანიის სავიზიტო ბარათია ხარისხი, პროფესიონალი და მაღალკვალიფიციური გუნდი, სამომავლოდ გათვლილი სწორი სტრატეგია და, რაც მთავარია, მშენებლობის პროცესის ეფექტური მართვა.",
    "კომპანიამ დაარსების დღიდან დაიწყო მაღალი სტანდარტებით მშენებლობა, რისი დამსახურებითაც დღემდე განვითარების პროცესშია და სარგებლობს მომხმარებელთა ნდობით. წარმატების მნიშვნელოვანი ფაქტორია ეფექტური მენეჯმენტი, მაღალი პასუხისმგებლობა საქმის მიმართ და, რაც ყველაზე მთავარია, მომხმარებელთა ინტერესებისა და უფლებების დაცვა.",
    "შპს „კომფორტ ბილდინგი“ გამოირჩევა სოციალური პასუხისმგებლობის მაღალი ხარისხით და გთავაზობთ კომფორტს საქმის ნებისმიერ პროცესში. სწორედ ამ მიდგომამ შესაძლებელი გახადა ისეთი მრავალსართულიანი საცხოვრებელი კომპლექსების მშენებლობა, რომლებიც პასუხობს ხარისხის ყველა სტანდარტს.",
    "„კომფორტ ბილდინგი“ არის სამშენებლო კომპანია, რომელსაც ენდობიან — სწორედ ეს გვაძლევს მოტივაციას, დავგეგმოთ საქმიანობის გაფართოება და განვახორციელოთ ახალი სამშენებლო პროექტები.",
  ],
  en: [
    "LLC Comfort Building is a construction company operating successfully in the city of Batumi. The company's calling card is quality, a professional and highly qualified team, a sound strategy for the future and — above all — effective management of the construction process.",
    "Since its founding, the company has built to high standards, which is why it keeps growing and enjoys the trust of its customers. The key factors of its success are effective management, a high sense of responsibility, and — most importantly — protecting the interests and rights of customers.",
    "Comfort Building stands out for its strong social responsibility and offers comfort at every stage of the process. This approach has made it possible to build multi-storey residential complexes that meet every quality standard.",
    "Comfort Building is a construction company that people trust — and that trust motivates us to expand and take on new construction projects.",
  ],
  ru: [
    "ООО «Комфорт Билдинг» — строительная компания, успешно работающая в городе Батуми. Визитная карточка компании — качество, профессиональная и высококвалифицированная команда, правильная стратегия на будущее и, самое главное, эффективное управление процессом строительства.",
    "С момента основания компания строит по высоким стандартам, благодаря чему продолжает развиваться и пользуется доверием заказчиков. Важные факторы успеха — эффективный менеджмент, высокая ответственность за дело и, прежде всего, защита интересов и прав клиентов.",
    "«Комфорт Билдинг» отличается высокой социальной ответственностью и предлагает комфорт на каждом этапе. Именно такой подход позволил построить многоэтажные жилые комплексы, отвечающие всем стандартам качества.",
    "«Комфорт Билдинг» — строительная компания, которой доверяют. Это доверие мотивирует нас расширять деятельность и реализовывать новые строительные проекты.",
  ],
};

/** The advantages copy, from the About page. */
export const ADVANTAGES: LocalizedList = {
  ka: [
    "მშენებარე საცხოვრებელი ფართის შეძენისას წარმატების გასაღები სამშენებლო კომპანიის სწორად არჩევაა. კომპანიები, რომლებიც ბაზარზე წლებია წარმატებით ოპერირებენ, საზოგადოებაში დიდ ნდობას იმსახურებენ.",
    "კომპანიის პრიორიტეტი ხარისხიანი მასალებით უპრობლემო მშენებლობაა — ყველა უსაფრთხოების წესის დაცვით, რომ საფრთხე არ შეექმნას მომუშავე ადამიანებს და კლიენტს დროულად ჩაბარდეს შეძენილი ფართი.",
    "აშენებულ ობიექტებს ხელსაყრელი ადგილმდებარეობა აქვს — კომპანია მომხმარებელს საცხოვრებლად უსაფრთხო და კომფორტულ გარემოს სთავაზობს.",
  ],
  en: [
    "When buying a home under construction, the key to success is choosing the right builder. Companies that have operated successfully on the market for years earn the public's trust.",
    "The company's priority is trouble-free construction with quality materials — observing every safety rule so that workers are never put at risk and buyers receive their homes on time.",
    "Every building enjoys a convenient location — the company offers its customers a safe and comfortable living environment.",
  ],
  ru: [
    "При покупке строящегося жилья ключ к успеху — правильный выбор застройщика. Компании, которые годами успешно работают на рынке, заслуживают доверие общества.",
    "Приоритет компании — качественное строительство без задержек, с соблюдением всех правил безопасности: чтобы не подвергать риску работников и вовремя передать покупателю приобретённое жильё.",
    "Все построенные объекты имеют удачное расположение — компания предлагает клиентам безопасную и комфортную среду для жизни.",
  ],
};

export interface Service {
  readonly key: string;
  readonly title: Localized;
  readonly body: Localized;
}

/** The three services offered alongside construction, from the About page. */
export const SERVICES: readonly Service[] = [
  {
    key: "interior",
    title: { ka: "ინტერიერი", en: "Interior", ru: "Интерьер" },
    body: {
      ka: "შეძენილ ბინას მყუდროებას მიანიჭებს თქვენივე გემოვნებით შექმნილი ინტერიერი, რომელიც ჩვენი დახმარებით შესრულდება.",
      en: "An interior created to your own taste — completed with our help — will make your new apartment truly cosy.",
      ru: "Интерьер, созданный по вашему вкусу и выполненный с нашей помощью, придаст уют приобретённой квартире.",
    },
  },
  {
    key: "auto",
    title: {
      ka: "საავტომობილო მომსახურება",
      en: "Automobile service",
      ru: "Автомобильные услуги",
    },
    body: {
      ka: "ჩვენს კომპლექსებში ბინის მყიდველებს შეუძლიათ ისარგებლონ საავტომობილო მომსახურებით — დაზოგეთ დრო, ფული და ძალისხმევა.",
      en: "Buyers of apartments in our complexes can also use our automobile services — saving time, money and effort.",
      ru: "Покупатели квартир в наших комплексах могут воспользоваться автомобильными услугами — экономя время, деньги и силы.",
    },
  },
  {
    key: "repair",
    title: { ka: "რემონტი", en: "Repair", ru: "Ремонт" },
    body: {
      ka: "კომპანია ბინის შეძენას მაქსიმალურად კომფორტულს ხდის და კლიენტებს სარემონტო სამუშაოებში ეხმარება — მათ შორის სამშენებლო მასალების მომარაგებით.",
      en: "The company makes buying an apartment as comfortable as possible and helps clients with renovation — including supplying building materials.",
      ru: "Компания делает покупку квартиры максимально комфортной и помогает клиентам с ремонтом — включая поставку строительных материалов.",
    },
  },
];

export interface Stat {
  readonly value: string;
  readonly label: Localized;
}

/** Stable portfolio facts derived from the published project pages. */
export const STATS: readonly Stat[] = [
  {
    value: "7",
    label: {
      ka: "ოფიციალურ არქივში გამოქვეყნებული პროექტი",
      en: "Projects in the official archive",
      ru: "Проектов в официальном архиве",
    },
  },
  {
    value: "2",
    label: {
      ka: "ქალაქი — ბათუმი და თბილისი",
      en: "Cities — Batumi & Tbilisi",
      ru: "Города — Батуми и Тбилиси",
    },
  },
  {
    value: "2014",
    label: {
      ka: "პირველი გამოქვეყნებული პროექტის დაწყება",
      en: "Earliest published project start",
      ru: "Начало первого опубликованного проекта",
    },
  },
  {
    value: "2024",
    label: {
      ka: "ბოლო გამოქვეყნებული დასრულების თარიღი",
      en: "Latest published completion date",
      ru: "Последний опубликованный срок завершения",
    },
  },
];
