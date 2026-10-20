import type { Lang } from "./types";

export interface Dict {
  readonly nav: {
    readonly home: string;
    readonly apartments: string;
    readonly guide: string;
    readonly projects: string;
    readonly about: string;
    readonly contact: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly titleA: string;
    readonly titleB: string;
    readonly lede: string;
  };
  readonly titleBlock: {
    readonly project: string;
    readonly location: string;
    readonly status: string;
    readonly floors: string;
    readonly price: string;
    readonly areas: string;
    readonly start: string;
    readonly completion: string;
  };
  readonly status: {
    readonly ongoing: string;
    readonly completed: string;
  };
  readonly sections: {
    readonly projects: string;
    readonly projectsLede: string;
    readonly about: string;
    readonly services: string;
    readonly contact: string;
    readonly gallery: string;
    readonly floorplans: string;
    readonly features: string;
    readonly availability: string;
    readonly location: string;
    readonly advantages: string;
  };
  readonly cta: {
    readonly availableApartments: string;
    readonly allProjects: string;
    readonly viewProject: string;
    readonly call: string;
    readonly write: string;
    readonly aboutUs: string;
    readonly interested: string;
    readonly interestedLede: string;
    readonly nextProject: string;
  };
  readonly filters: {
    readonly label: string;
    readonly all: string;
    readonly ongoing: string;
    readonly completed: string;
  };
  readonly misc: {
    readonly sold: string;
    readonly followUs: string;
    readonly rights: string;
    readonly openMap: string;
    readonly menu: string;
    readonly close: string;
    readonly previous: string;
    readonly next: string;
    readonly skipContent: string;
    readonly sourceData: string;
    readonly tba: string;
    readonly llc: string;
  };
}

export const DICT: Record<Lang, Dict> = {
  ka: {
    nav: {
      home: "მთავარი",
      apartments: "გასაყიდი ბინები",
      guide: "ბინის ყიდვის გზამკვლევი",
      projects: "პროექტები",
      about: "ჩვენ შესახებ",
      contact: "კონტაქტი",
    },
    hero: {
      eyebrow: "Comfort Building · ბათუმი",
      titleA: "სამშენებლო კომპანია",
      titleB: "ბათუმში",
      lede: "გაეცანით გასაყიდ ბინებს, ასევე Comfort Building-ის საცხოვრებელ პროექტებს ბათუმსა და თბილისში.",
    },
    titleBlock: {
      project: "პროექტი",
      location: "მდებარეობა",
      status: "სტატუსი",
      floors: "სართული",
      price: "ფასი",
      areas: "ფართები",
      start: "დაწყება",
      completion: "დასრულება",
    },
    status: { ongoing: "მიმდინარე", completed: "დასრულებული" },
    sections: {
      projects: "პროექტების რეესტრი",
      projectsLede: "შვიდი გამოქვეყნებული საცხოვრებელი პროექტი ბათუმსა და თბილისში.",
      about: "ჩვენ შესახებ",
      services: "მომსახურება",
      contact: "კონტაქტი",
      gallery: "ფოტოგალერეა",
      floorplans: "გეგმარებები",
      features: "მახასიათებლები",
      availability: "თავისუფალი ფართები",
      location: "მდებარეობა",
      advantages: "უპირატესობები",
    },
    cta: {
      availableApartments: "გასაყიდი ბინების ნახვა",
      allProjects: "ყველა პროექტი",
      viewProject: "პროექტის ნახვა",
      call: "დაგვირეკეთ",
      write: "მოგვწერეთ",
      aboutUs: "გაიგეთ მეტი",
      interested: "დაგაინტერესათ ბინა?",
      interestedLede: "დაგვირეკეთ ან მოგვწერეთ — გიპასუხებთ და შეგირჩევთ ბინას თქვენს საჭიროებებზე მორგებულს.",
      nextProject: "შემდეგი პროექტი",
    },
    filters: {
      label: "პროექტების გაფილტვრა სტატუსის მიხედვით",
      all: "ყველა",
      ongoing: "მიმდინარე",
      completed: "დასრულებული",
    },
    misc: {
      sold: "გაყიდულია",
      followUs: "გამოგვყევით",
      rights: "ყველა უფლება დაცულია",
      openMap: "რუკაზე ნახვა",
      menu: "მენიუ",
      close: "დახურვა",
      previous: "წინა",
      next: "შემდეგი",
      skipContent: "კონტენტზე გადასვლა",
      sourceData:
        "ფასი და ხელმისაწვდომობა ნაჩვენებია წყარო ვებსაიტზე გამოქვეყნებული მონაცემებით — მიმდინარე ინფორმაცია გადაამოწმეთ კომპანიასთან.",
      tba: "დაზუსტდება",
      llc: "შპს „კომფორტ ბილდინგი“",
    },
  },
  en: {
    nav: {
      home: "Home",
      apartments: "Apartments",
      guide: "Buyer guide",
      projects: "Projects",
      about: "About",
      contact: "Contact",
    },
    hero: {
      eyebrow: "Comfort Building · Batumi",
      titleA: "Residential developer",
      titleB: "in Batumi",
      lede: "See apartments for sale, plus Comfort Building's residential projects in Batumi and Tbilisi.",
    },
    titleBlock: {
      project: "Project",
      location: "Location",
      status: "Status",
      floors: "Floors",
      price: "Price",
      areas: "Areas",
      start: "Start",
      completion: "Completion",
    },
    status: { ongoing: "Ongoing", completed: "Completed" },
    sections: {
      projects: "Project register",
      projectsLede: "Seven published residential projects across Batumi and Tbilisi.",
      about: "About us",
      services: "Services",
      contact: "Contact",
      gallery: "Photo gallery",
      floorplans: "Floor plans",
      features: "Specifications",
      availability: "Availability",
      location: "Location",
      advantages: "Advantages",
    },
    cta: {
      availableApartments: "View apartments for sale",
      allProjects: "All projects",
      viewProject: "View project",
      call: "Call us",
      write: "Write to us",
      aboutUs: "Learn more",
      interested: "Interested in an apartment?",
      interestedLede: "Call or write to us — we will answer and help you choose an apartment that fits your needs.",
      nextProject: "Next project",
    },
    filters: {
      label: "Filter projects by status",
      all: "All",
      ongoing: "Ongoing",
      completed: "Completed",
    },
    misc: {
      sold: "Sold",
      followUs: "Follow us",
      rights: "All rights reserved",
      openMap: "Open in Maps",
      menu: "Menu",
      close: "Close",
      previous: "Previous",
      next: "Next",
      skipContent: "Skip to content",
      sourceData:
        "Price and availability are shown as published on the source website — confirm current details with the company.",
      tba: "TBA",
      llc: "LLC Comfort Building",
    },
  },
  ru: {
    nav: {
      home: "Главная",
      apartments: "Квартиры",
      guide: "Как купить квартиру",
      projects: "Проекты",
      about: "О нас",
      contact: "Контакты",
    },
    hero: {
      eyebrow: "Comfort Building · Батуми",
      titleA: "Строительная компания",
      titleB: "в Батуми",
      lede: "Смотрите квартиры в продаже, а также жилые проекты Comfort Building в Батуми и Тбилиси.",
    },
    titleBlock: {
      project: "Проект",
      location: "Расположение",
      status: "Статус",
      floors: "Этажей",
      price: "Цена",
      areas: "Площади",
      start: "Начало",
      completion: "Завершение",
    },
    status: { ongoing: "Строится", completed: "Завершён" },
    sections: {
      projects: "Реестр проектов",
      projectsLede: "Семь опубликованных жилых проектов в Батуми и Тбилиси.",
      about: "О нас",
      services: "Услуги",
      contact: "Контакты",
      gallery: "Фотогалерея",
      floorplans: "Планировки",
      features: "Характеристики",
      availability: "Свободные площади",
      location: "Расположение",
      advantages: "Преимущества",
    },
    cta: {
      availableApartments: "Смотреть квартиры",
      allProjects: "Все проекты",
      viewProject: "Смотреть проект",
      call: "Позвоните нам",
      write: "Напишите нам",
      aboutUs: "Узнать больше",
      interested: "Заинтересовала квартира?",
      interestedLede: "Позвоните или напишите нам — мы ответим и поможем подобрать квартиру под ваши потребности.",
      nextProject: "Следующий проект",
    },
    filters: {
      label: "Фильтр проектов по статусу",
      all: "Все",
      ongoing: "Строится",
      completed: "Завершённые",
    },
    misc: {
      sold: "Продано",
      followUs: "Подписывайтесь",
      rights: "Все права защищены",
      openMap: "Открыть на карте",
      menu: "Меню",
      close: "Закрыть",
      previous: "Назад",
      next: "Далее",
      skipContent: "Перейти к содержанию",
      sourceData:
        "Цена и наличие показаны по данным исходного сайта — уточните актуальную информацию у компании.",
      tba: "Уточняется",
      llc: "ООО «Комфорт Билдинг»",
    },
  },
};

export function getDict(lang: Lang): Dict {
  return DICT[lang];
}
