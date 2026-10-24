import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getDict } from "@/lib/dictionary";
import { inquiryHref } from "@/lib/inquiry-context";
import { PROJECTS } from "@/lib/projects";
import { COMPANY_NAME } from "@/lib/site";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  BUYING_GUIDE_PUBLISHED_AT,
  BUYING_GUIDE_UPDATED_AT,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  SITE_URL,
  webPageJsonLd,
} from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const COMFORT_HOUSE = PROJECTS.find(
  (project) => project.slug === "comfort-house",
)!;
const HERO_IMAGE =
  COMFORT_HOUSE.heroImage ??
  COMFORT_HOUSE.listingImage ??
  COMFORT_HOUSE.cover;
const AVAILABLE_COUNT = COMFORT_HOUSE.inventory!.floors.flatMap(
  (floor) => floor.units,
).filter(
  (unit) => unit.kind === "apartment" && unit.status === "available",
).length;

const META_TITLE: Localized = {
  ka: "როგორ ვიყიდოთ ბინა ბათუმში | მყიდველის გზამკვლევი",
  en: "How to buy an apartment in Batumi, including as a foreigner | Buyer guide",
  ru: "Как купить квартиру в Батуми, в том числе иностранцу | Руководство покупателя",
};

const META_DESCRIPTION: Localized = {
  ka: "პრაქტიკული გზამკვლევი ბათუმში ბინის შესაძენად: ფასისა და ფართობის შედარება, დეველოპერისა და საჯარო რეესტრის შემოწმება, ყიდვა საზღვარგარეთიდან და ბინადრობის ნებართვა.",
  en: "A practical guide to buying an apartment in Batumi: compare total prices and areas, check the developer and Public Registry, buy from abroad, and residence permits for owners.",
  ru: "Как купить квартиру в Батуми: полная стоимость и площадь, проверка застройщика и реестра, покупка иностранцем и дистанционно, вид на жительство для владельцев.",
};

type StepAction = "apartments" | "projects" | "registry" | "contact";

const COPY = {
  ka: {
    eyebrow: "მყიდველის პრაქტიკული გზამკვლევი",
    title: "როგორ ვიყიდოთ ბინა ბათუმში",
    lede: "ექვსი ნაბიჯი ბინის, დეველოპერისა და დოკუმენტების შესადარებლად. გამოიყენეთ ეს სია პირველ ზარამდე და ხელშეკრულების ხელმოწერამდე.",
    annotation: "BUYER GUIDE / BATUMI / 06 STEPS",
    stats: [
      ["გამოქვეყნებული პროექტი", String(PROJECTS.length).padStart(2, "0")],
      ["გასაყიდი ბინა", String(AVAILABLE_COUNT).padStart(2, "0")],
      ["განახლებულია", "24.10.26"],
    ],
    introTitle: "ჯერ შეადარეთ. შემდეგ დაუკავშირდით კონკრეტული კითხვებით.",
    intro: [
      "კარგი არჩევანი იწყება არა ყველაზე დაბალი მ²-ის ფასით, არამედ სრული სურათით: ბინის საერთო ფართობით, სართულით, აივნით, საბოლოო ღირებულებით, პროექტის სტატუსითა და ხელშეკრულების პირობებით.",
      "ეს გვერდი იურიდიული ან ფინანსური კონსულტაცია არ არის. მნიშვნელოვანი დოკუმენტები და ხელშეკრულება დამოუკიდებელ იურისტთან გადაამოწმეთ.",
    ],
    checklistTitle: "რა მოამზადოთ ზარამდე",
    checklist: [
      "სასურველი სრული ბიუჯეტი",
      "ბინის მინიმალური და მაქსიმალური ფართობი",
      "სასურველი სართული",
      "საცხოვრებლად თუ გასაქირავებლად",
      "გადახდის სასურველი გრაფიკი",
      "2–3 შერჩეული ბინის ნომერი",
      "კითხვები დასრულების მდგომარეობაზე",
      "დოკუმენტების სია იურისტისთვის",
    ],
    steps: [
      {
        title: "დაიწყეთ სრული ბიუჯეტით",
        paragraphs: [
          "შეადარეთ არა მხოლოდ ფასი მ²-ზე, არამედ სრული ღირებულება. ერთი და იგივე ტარიფი განსხვავებულ ფართობზე სრულიად განსხვავებულ ბიუჯეტს ქმნის.",
          "გაყიდვების გუნდს წერილობით ჰკითხეთ საბოლოო ფასი, ვალუტა, გადახდის გრაფიკი და რა შედის შეთავაზებაში. Comfort House-ის ფასები საიტზე არ ქვეყნდება — მოითხოვეთ ისინი ზარით ან ელფოსტით.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "შეარჩიეთ ფართობი, სართული და მდებარეობა",
        paragraphs: [
          "გეგმა გაჩვენებთ ფართობებსა და ოთახების განლაგებას, მაგრამ ადგილზე შეამოწმეთ მისასვლელი გზა, გარემო, ბუნებრივი განათება და საერთო სივრცეები.",
          "შეინახეთ რამდენიმე ალტერნატივა. ასე ფასის, ფართობისა და სართულის შედარება უფრო მარტივი იქნება.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "ნახეთ დეველოპერის დასრულებული პროექტები",
        paragraphs: [
          "წინა პროექტები გაძლევთ შესაძლებლობას შეაფასოთ მდებარეობები, მასშტაბი და კომპანიის მუშაობის ისტორია. თუ შესაძლებელია, შენობები ადგილზე დაათვალიერეთ.",
          "Comfort Building-ის საიტზე გამოქვეყნებულია შვიდი პროექტი ბათუმსა და თბილისში, თითოეული მისამართით, ფოტოებითა და სტატუსით.",
        ],
        action: "projects" as StepAction,
      },
      {
        title: "გადაამოწმეთ რეესტრი და დოკუმენტები",
        paragraphs: [
          "საქართველოს საჯარო რეესტრის ეროვნული სააგენტო გასცემს უძრავ ქონებასთან დაკავშირებულ ამონაწერებსა და ინფორმაციას რეგისტრირებული უფლებების, ვალდებულებებისა და საჯარო-სამართლებრივი შეზღუდვების შესახებ.",
          "სთხოვეთ დამოუკიდებელ იურისტს გადაამოწმოს მოქმედი ამონაწერი, საკადასტრო მონაცემები, მხარეების უფლებამოსილება, მშენებლობის დოკუმენტები და ხელშეკრულება კონკრეტული ბინის მიხედვით.",
        ],
        action: "registry" as StepAction,
      },
      {
        title: "წაიკითხეთ ხელშეკრულება გადახდამდე",
        paragraphs: [
          "ხელშეკრულებაში მკაფიოდ უნდა გაიგოთ რომელი ობიექტია შეთანხმების საგანი, როგორ ითვლება ფართობი და ფასი, რა მდგომარეობაში ბარდება ბინა, როგორია ვადები, რეგისტრაციის პროცესი და მხარეთა პასუხისმგებლობა.",
          "თუ რომელიმე პირობა გაუგებარია, მოითხოვეთ განმარტება წერილობით და მიიღეთ დამოუკიდებელი იურიდიული რჩევა თანხის გადახდამდე.",
        ],
        action: "contact" as StepAction,
      },
      {
        title: "დაუკავშირდით კონკრეტული ბინის ნომრით",
        paragraphs: [
          "ზარში ან წერილში მიუთითეთ ბინის ნომერი, ფართობი და სართული. ჰკითხეთ მიმდინარე ხელმისაწვდომობა, საბოლოო ფასი, გადახდის პირობები და დათვალიერების შესაძლებლობა.",
          "კონკრეტული მოთხოვნა გაყიდვების გუნდს ზუსტად აჩვენებს, რომელი შეთავაზება გაინტერესებთ.",
        ],
        action: "contact" as StepAction,
      },
    ],
    actions: {
      apartments: "შეადარეთ გასაყიდი ბინები",
      projects: "ნახეთ ყველა პროექტი",
      registry: "საჯარო რეესტრის ოფიციალური საიტი",
      contact: "მოამზადეთ მოთხოვნა",
    },
    ctaTitle: "უკვე შეარჩიეთ ბინა?",
    ctaLede: "მიუთითეთ ბინის ნომერი და თქვენი საკონტაქტო ინფორმაცია. საიტი მოამზადებს წერილს გაყიდვების გუნდისთვის.",
    ctaPrimary: "მოთხოვნის მომზადება",
    ctaSecondary: "ყველა გასაყიდი ბინა",
    abroadEyebrow: "ყიდვა საზღვარგარეთიდან",
    abroadTitle: "ბინის ყიდვა ბათუმში უცხო ქვეყნის მოქალაქისთვის",
    abroadLede: "ჩვენი მყიდველების ნაწილი საქართველოს გარეთ ცხოვრობს. ესაა საკითხები, რომლებზეც ყველაზე ხშირად გვეკითხებიან. წესები იცვლება, ამიტომ გადახდამდე დეტალები დამოუკიდებელ იურისტთან დააზუსტეთ.",
    abroad: [
      {
        title: "უცხოელს შეუძლია ბინის ფლობა",
        text: "უცხო ქვეყნის მოქალაქეს შეუძლია საქართველოში ბინა იყიდოს და საკუთარ სახელზე დაარეგისტრიროს. შეზღუდვები ეხება სასოფლო-სამეურნეო მიწას და არა ბინებს.",
      },
      {
        title: "საკუთრება საჯარო რეესტრში რეგისტრირდება",
        text: "ნასყიდობა რეგისტრირდება საჯარო რეესტრის ეროვნულ სააგენტოში, როგორც წესი, იუსტიციის სახლის მეშვეობით. მოითხოვეთ კონკრეტული ბინის მოქმედი ამონაწერი.",
      },
      {
        title: "ყიდვა ჩამოსვლის გარეშეც შეიძლება",
        text: "თქვენ ნაცვლად ხელს წარმომადგენელი მოაწერს სანოტარო მინდობილობით. საზღვარგარეთ გაფორმებულ მინდობილობას, როგორც წესი, სჭირდება აპოსტილი ან საკონსულო ლეგალიზაცია და დამოწმებული ქართული თარგმანი.",
      },
      {
        title: "ბინადრობის ნებართვა ქონების მფლობელისთვის",
        text: "საბაზრო ღირებულებით არანაკლებ 150 000 აშშ დოლარის საცხოვრებელი ქონების ფლობამ შეიძლება მოგცეთ დროებითი ბინადრობის ნებართვის უფლება. 2026 წლის 1 მარტიდან ზღვარი 100 000 დოლარიდან გაიზარდა; მოქმედი წესები სახელმწიფო სერვისების განვითარების სააგენტოში დააზუსტეთ.",
      },
      {
        title: "გაყიდვები ქართულ, ინგლისურ და რუსულ ენებზე",
        text: "გაყიდვების გუნდი სამივე ენაზე პასუხობს ზარებსა და წერილებს და გამოგიგზავნით კონკრეტული ბინის გეგმას, ფასსა და ფოტოებს.",
      },
    ],
    abroadSource: "სახელმწიფო სერვისების განვითარების სააგენტო",
    faqTitle: "ხშირი კითხვები ბინის ყიდვამდე",
    faqs: [
      {
        question: "რატომ არ არის ფასები საიტზე?",
        answer: "Comfort House-ის ფასები მოთხოვნისამებრ მიეწოდება. დაგვირეკეთ ან მოგვწერეთ ელფოსტაზე — გაყიდვების გუნდი გეტყვით მიმდინარე ფასს, ხელმისაწვდომობასა და გადახდის პირობებს.",
      },
      {
        question: "რა უნდა ვკითხო დეველოპერს პირველ ზარზე?",
        answer: "დაასახელეთ ბინის ნომერი და ჰკითხეთ მიმდინარე სტატუსი, სრული ფასი, ფართობის გამოთვლის წესი, ჩაბარების მდგომარეობა, გადახდის გრაფიკი, ხელშეკრულება და დათვალიერების დრო.",
      },
      {
        question: "რატომ უნდა გადავამოწმო საჯარო რეესტრი?",
        answer: "მოქმედი ამონაწერი და საკადასტრო მონაცემები დამოუკიდებელ იურისტს ეხმარება შეაფასოს კონკრეტულ ქონებასთან დაკავშირებული რეგისტრირებული ინფორმაცია და ხელშეკრულების მხარეები.",
      },
      {
        question: "შემიძლია ბინა დისტანციურად შევარჩიო?",
        answer: "ბინების ფართობებისა და სართულების შედარება ონლაინ შეგიძლიათ. დისტანციური გარიგების, წარმომადგენლობის, ხელმოწერისა და რეგისტრაციის პირობები დეველოპერთან და დამოუკიდებელ იურისტთან წინასწარ შეათანხმეთ.",
      },
      {
        question: "შეუძლია თუ არა უცხოელს ბინის ყიდვა ბათუმში?",
        answer: "დიახ. უცხო ქვეყნის მოქალაქეს შეუძლია საქართველოში ბინა იყიდოს და საჯარო რეესტრში საკუთარ სახელზე დაარეგისტრიროს. შეზღუდვები ეხება სასოფლო-სამეურნეო მიწას და არა ბინებს. გადახდამდე დოკუმენტები დამოუკიდებელ იურისტს გადაამოწმებინეთ.",
      },
      {
        question: "ბინის ყიდვა ბინადრობის ნებართვას იძლევა?",
        answer: "საბაზრო ღირებულებით არანაკლებ 150 000 აშშ დოლარის საცხოვრებელი ქონების ფლობამ შეიძლება მოგცეთ დროებითი ბინადრობის ნებართვის უფლება (2026 წლის 1 მარტამდე ზღვარი 100 000 დოლარი იყო). გადაწყვეტილებას სახელმწიფო იღებს; მოქმედი წესები სახელმწიფო სერვისების განვითარების სააგენტოში დააზუსტეთ.",
      },
    ],
  },
  en: {
    eyebrow: "A practical buyer guide",
    title: "How to buy an apartment in Batumi",
    lede: "Six steps for comparing apartments, the developer, and documents. Use this checklist before your first call and before signing a contract.",
    annotation: "BUYER GUIDE / BATUMI / 06 STEPS",
    stats: [
      ["published projects", String(PROJECTS.length).padStart(2, "0")],
      ["apartments for sale", String(AVAILABLE_COUNT).padStart(2, "0")],
      ["last updated", "24.10.26"],
    ],
    introTitle: "Compare first. Then contact the developer with specific questions.",
    intro: [
      "A sound comparison starts with the full picture, not the lowest advertised rate per m². Look at total area, floor, balcony, total price, project status, and contract terms together.",
      "This page is not legal or financial advice. Ask an independent lawyer to review important records and the contract.",
    ],
    checklistTitle: "Prepare before you call",
    checklist: [
      "Maximum total budget",
      "Minimum and maximum apartment area",
      "Preferred floor",
      "Home use or rental use",
      "Preferred payment schedule",
      "Two or three apartment numbers",
      "Questions about delivery condition",
      "Document list for your lawyer",
    ],
    steps: [
      {
        title: "Start with the total budget",
        paragraphs: [
          "Compare the total price, not only the rate per m². The same rate produces a very different budget when apartment sizes differ.",
          "Ask the sales team to confirm the final price, currency, payment schedule, and included work in writing. Comfort House prices are not published online — ask for them by phone or email.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "Choose the area, floor, and location",
        paragraphs: [
          "A floor plan explains dimensions and layout. Visit the location to assess access, surroundings, natural light, and shared spaces for yourself.",
          "Keep a short list of alternatives so you can compare floor, area, and price without starting over when availability changes.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "Review the developer's completed work",
        paragraphs: [
          "Earlier projects help you assess locations, scale, and the company's operating history. Visit completed buildings where practical.",
          "Comfort Building publishes seven projects in Batumi and Tbilisi with addresses, photographs, and project status.",
        ],
        action: "projects" as StepAction,
      },
      {
        title: "Check the registry and project documents",
        paragraphs: [
          "Georgia's National Agency of Public Registry provides extracts and information about registered property rights, obligations, and public-law restrictions.",
          "Ask an independent Georgian lawyer to review a current extract, cadastral information, the parties' authority, construction documents, and the contract for the specific apartment.",
        ],
        action: "registry" as StepAction,
      },
      {
        title: "Read the contract before paying",
        paragraphs: [
          "Understand the exact property covered by the agreement, how area and price are calculated, the delivery condition, dates, registration process, and each party's responsibilities.",
          "Request written clarification for anything unclear and obtain independent legal advice before transferring money.",
        ],
        action: "contact" as StepAction,
      },
      {
        title: "Contact sales with an apartment number",
        paragraphs: [
          "Include the apartment number, area, and floor in your call or email. Ask about current availability, the final price, payment terms, and viewing arrangements.",
          "A specific request tells the sales team exactly which published offer you are considering.",
        ],
        action: "contact" as StepAction,
      },
    ],
    actions: {
      apartments: "Compare apartments for sale",
      projects: "Review all projects",
      registry: "Official Public Registry website",
      contact: "Prepare an inquiry",
    },
    ctaTitle: "Already shortlisted an apartment?",
    ctaLede: "Include its number and your contact details. The site will prepare an email to the sales team.",
    ctaPrimary: "Prepare an inquiry",
    ctaSecondary: "All apartments for sale",
    abroadEyebrow: "Buying from abroad",
    abroadTitle: "Buying an apartment in Batumi as a foreign citizen",
    abroadLede: "Many of our buyers live outside Georgia. These are the points they ask about most. Rules change, so confirm the details with an independent lawyer before you pay.",
    abroad: [
      {
        title: "Foreigners can own apartments",
        text: "Foreign citizens can buy an apartment in Georgia and register it in their own name. Restrictions apply to agricultural land, not to apartments.",
      },
      {
        title: "Ownership is registered in the Public Registry",
        text: "The purchase is registered with the National Agency of Public Registry, usually through a Public Service Hall. Ask for a current registry extract for the specific apartment.",
      },
      {
        title: "You can buy without travelling",
        text: "A representative can sign for you with a notarised power of attorney. One signed abroad usually needs an apostille or consular legalisation and a certified Georgian translation.",
      },
      {
        title: "Residence permit for property owners",
        text: "Owning residential property with a market value of at least USD 150,000 can qualify you for a temporary residence permit. The threshold rose from USD 100,000 on 1 March 2026; check the current rules with the Public Service Development Agency.",
      },
      {
        title: "Sales in Georgian, English and Russian",
        text: "The sales team answers calls and emails in all three languages and can send you the plan, price and photos of a specific apartment.",
      },
    ],
    abroadSource: "Public Service Development Agency",
    faqTitle: "Questions to settle before buying",
    faqs: [
      {
        question: "Why are prices not shown on the website?",
        answer: "Comfort House prices are provided on request. Call or email the sales team for the current price, availability, and payment terms.",
      },
      {
        question: "What should I ask during the first call?",
        answer: "Name the apartment number and ask about its current status, full price, area calculation, delivery condition, payment schedule, contract, and viewing times.",
      },
      {
        question: "Why check the Public Registry?",
        answer: "A current extract and cadastral information help an independent lawyer assess registered information connected to the specific property and the parties to the agreement.",
      },
      {
        question: "Can I choose an apartment remotely?",
        answer: "You can compare published apartment areas and floors online. Discuss remote transactions, representation, signing, and registration with the developer and an independent lawyer before proceeding.",
      },
      {
        question: "Can a foreign citizen buy an apartment in Batumi?",
        answer: "Yes. Foreign citizens can buy an apartment in Georgia and register it in their own name in the Public Registry. Restrictions apply to agricultural land, not to apartments. Have an independent lawyer check the documents before paying.",
      },
      {
        question: "Does buying an apartment give a residence permit?",
        answer: "Owning residential property with a market value of at least USD 150,000 can qualify the owner for a temporary residence permit (the threshold was USD 100,000 before 1 March 2026). The state decides each application; check the current rules with the Public Service Development Agency.",
      },
    ],
  },
  ru: {
    eyebrow: "Практическое руководство покупателя",
    title: "Как купить квартиру в Батуми",
    lede: "Шесть шагов для сравнения квартир, застройщика и документов. Используйте этот список до первого звонка и до подписания договора.",
    annotation: "BUYER GUIDE / BATUMI / 06 STEPS",
    stats: [
      ["опубликованных проектов", String(PROJECTS.length).padStart(2, "0")],
      ["квартир в продаже", String(AVAILABLE_COUNT).padStart(2, "0")],
      ["обновлено", "24.10.26"],
    ],
    introTitle: "Сначала сравните. Затем задайте застройщику конкретные вопросы.",
    intro: [
      "Сравнение начинается с полной картины, а не с самой низкой цены за м². Одновременно учитывайте общую площадь, этаж, балкон, полную стоимость, статус проекта и условия договора.",
      "Эта страница не заменяет юридическую или финансовую консультацию. Попросите независимого юриста проверить важные документы и договор.",
    ],
    checklistTitle: "Что подготовить до звонка",
    checklist: [
      "Максимальный общий бюджет",
      "Минимальная и максимальная площадь",
      "Предпочтительный этаж",
      "Для проживания или аренды",
      "Желаемый график оплаты",
      "Номера двух или трёх квартир",
      "Вопросы о состоянии при сдаче",
      "Список документов для юриста",
    ],
    steps: [
      {
        title: "Начните с общего бюджета",
        paragraphs: [
          "Сравнивайте полную стоимость, а не только цену за м². Одинаковая ставка даёт разный бюджет при разной площади квартиры.",
          "Попросите отдел продаж письменно подтвердить итоговую цену, валюту, график оплаты и состав предложения. Цены Comfort House на сайте не публикуются — запросите их по телефону или электронной почте.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "Выберите площадь, этаж и расположение",
        paragraphs: [
          "Планировка показывает размеры и расположение помещений. Посетите адрес, чтобы самостоятельно оценить подъезд, окружение, естественное освещение и общие зоны.",
          "Составьте короткий список вариантов. Так будет проще сравнить этаж, площадь и цену, если наличие изменится.",
        ],
        action: "apartments" as StepAction,
      },
      {
        title: "Изучите завершённые проекты застройщика",
        paragraphs: [
          "Предыдущие проекты помогают оценить расположение, масштаб и историю работы компании. По возможности посетите завершённые здания.",
          "Comfort Building публикует семь проектов в Батуми и Тбилиси с адресами, фотографиями и статусом.",
        ],
        action: "projects" as StepAction,
      },
      {
        title: "Проверьте реестр и документы",
        paragraphs: [
          "Национальное агентство публичного реестра Грузии выдаёт выписки и информацию о зарегистрированных правах на недвижимость, обязательствах и публично-правовых ограничениях.",
          "Попросите независимого юриста в Грузии проверить актуальную выписку, кадастровые данные, полномочия сторон, строительные документы и договор по конкретной квартире.",
        ],
        action: "registry" as StepAction,
      },
      {
        title: "Прочитайте договор до оплаты",
        paragraphs: [
          "Разберитесь, какой объект указан в договоре, как рассчитываются площадь и цена, в каком состоянии передаётся квартира, каковы сроки, порядок регистрации и ответственность сторон.",
          "Запросите письменное объяснение непонятных условий и получите независимую юридическую консультацию до перевода денег.",
        ],
        action: "contact" as StepAction,
      },
      {
        title: "Обратитесь в отдел продаж с номером квартиры",
        paragraphs: [
          "Укажите в звонке или письме номер квартиры, площадь и этаж. Спросите об актуальном наличии, итоговой цене, условиях оплаты и возможности просмотра.",
          "Конкретный запрос сразу показывает отделу продаж, какое опубликованное предложение вас интересует.",
        ],
        action: "contact" as StepAction,
      },
    ],
    actions: {
      apartments: "Сравнить квартиры в продаже",
      projects: "Посмотреть все проекты",
      registry: "Официальный сайт Публичного реестра",
      contact: "Подготовить запрос",
    },
    ctaTitle: "Уже выбрали несколько квартир?",
    ctaLede: "Укажите номер квартиры и свои контакты. Сайт подготовит письмо для отдела продаж.",
    ctaPrimary: "Подготовить запрос",
    ctaSecondary: "Все квартиры в продаже",
    abroadEyebrow: "Покупка из-за рубежа",
    abroadTitle: "Как иностранцу купить квартиру в Батуми",
    abroadLede: "Многие наши покупатели живут за пределами Грузии. Вот что они спрашивают чаще всего. Правила меняются, поэтому перед оплатой уточните детали у независимого юриста.",
    abroad: [
      {
        title: "Иностранцы могут владеть квартирой",
        text: "Иностранный гражданин может купить квартиру в Грузии и зарегистрировать её на своё имя. Ограничения касаются сельскохозяйственной земли, а не квартир.",
      },
      {
        title: "Право собственности регистрируется в Публичном реестре",
        text: "Покупка регистрируется в Национальном агентстве публичного реестра, обычно через Дом юстиции. Запросите актуальную выписку из реестра по конкретной квартире.",
      },
      {
        title: "Купить можно, не приезжая",
        text: "За вас может подписать представитель по нотариальной доверенности. Доверенности, оформленной за рубежом, обычно нужен апостиль или консульская легализация и заверенный перевод на грузинский язык.",
      },
      {
        title: "ВНЖ для владельцев недвижимости",
        text: "Владение жилой недвижимостью рыночной стоимостью от 150 000 долларов США может дать право на временный вид на жительство. С 1 марта 2026 года порог вырос со 100 000 долларов; актуальные условия уточняйте в Агентстве развития государственных услуг.",
      },
      {
        title: "Продажи на русском, английском и грузинском",
        text: "Отдел продаж отвечает на звонки и письма на трёх языках и может прислать планировку, цену и фото конкретной квартиры.",
      },
    ],
    abroadSource: "Агентство развития государственных услуг",
    faqTitle: "Вопросы, которые стоит решить до покупки",
    faqs: [
      {
        question: "Почему на сайте нет цен?",
        answer: "Цены Comfort House предоставляются по запросу. Позвоните или напишите в отдел продаж, чтобы узнать актуальную цену, наличие и условия оплаты.",
      },
      {
        question: "Что спросить во время первого звонка?",
        answer: "Назовите номер квартиры и спросите об актуальном статусе, полной цене, расчёте площади, состоянии при сдаче, графике оплаты, договоре и времени просмотра.",
      },
      {
        question: "Зачем проверять Публичный реестр?",
        answer: "Актуальная выписка и кадастровые данные помогают независимому юристу оценить зарегистрированную информацию по конкретной недвижимости и сторонам договора.",
      },
      {
        question: "Можно выбрать квартиру дистанционно?",
        answer: "Сравнить опубликованные площади и этажи квартир можно онлайн. Заранее обсудите с застройщиком и независимым юристом дистанционную сделку, представительство, подписание и регистрацию.",
      },
      {
        question: "Может ли иностранец купить квартиру в Батуми?",
        answer: "Да. Иностранный гражданин может купить квартиру в Грузии и зарегистрировать её на своё имя в Публичном реестре. Ограничения касаются сельскохозяйственной земли, а не квартир. Перед оплатой попросите независимого юриста проверить документы.",
      },
      {
        question: "Даёт ли покупка квартиры вид на жительство?",
        answer: "Владение жилой недвижимостью рыночной стоимостью от 150 000 долларов США может дать право на временный вид на жительство (до 1 марта 2026 года порог составлял 100 000 долларов). Решение принимает государство; актуальные условия уточняйте в Агентстве развития государственных услуг.",
      },
    ],
  },
} as const;

const RESIDENCE_URL = "https://sda.gov.ge/";

const REGISTRY_URL: Localized = {
  ka: "https://napr.gov.ge/ka/page/fees-and-terms/immovable-property-registration-fee",
  en: "https://napr.gov.ge/en/page/fees-and-terms/informational-services-fee",
  ru: "https://napr.gov.ge/en/page/fees-and-terms/informational-services-fee",
};

interface BuyingGuidePageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(
  params: BuyingGuidePageProps["params"],
): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

function actionHref(action: StepAction, lang: Lang) {
  if (action === "apartments") return `/${lang}/apartments`;
  if (action === "projects") return `/${lang}/projects`;
  if (action === "registry") return REGISTRY_URL[lang];
  return inquiryHref(lang);
}

function guideJsonLd(lang: Lang) {
  const copy = COPY[lang];
  const url = absoluteUrl(pagePath(lang, "/buying-guide"));

  return jsonLdGraph([
    {
      ...webPageJsonLd(
        lang,
        "/buying-guide",
        META_TITLE[lang],
        META_DESCRIPTION[lang],
      ),
      mainEntity: { "@id": `${url}#article` },
    },
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: copy.title,
      description: META_DESCRIPTION[lang],
      image: absoluteUrl(HERO_IMAGE.src),
      datePublished: BUYING_GUIDE_PUBLISHED_AT.toISOString(),
      dateModified: BUYING_GUIDE_UPDATED_AT.toISOString(),
      inLanguage: lang,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: copy.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    breadcrumbJsonLd([
      { name: "Comfort Building", path: pagePath(lang) },
      { name: copy.title, path: pagePath(lang, "/buying-guide") },
    ]),
  ]);
}

export async function generateMetadata({
  params,
}: BuyingGuidePageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang,
    title: META_TITLE[lang],
    description: META_DESCRIPTION[lang],
    suffix: "/buying-guide",
    image: HERO_IMAGE,
  });
}

export default async function BuyingGuidePage({
  params,
}: BuyingGuidePageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const copy = COPY[lang];

  return (
    <>
      <JsonLd data={guideJsonLd(lang)} />
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        lede={copy.lede}
        image={HERO_IMAGE.src}
        imageAlt={HERO_IMAGE.alt[lang]}
        annotation={copy.annotation}
      />

      <section className="border-y border-cream/10 bg-basalt">
        <div className="wrap grid sm:grid-cols-3">
          {copy.stats.map(([label, value]) => (
            <div
              key={label}
              className="-mt-px -ml-px border-t border-l border-cream/10 px-6 py-8"
            >
              <p className="font-mono text-[10px] tracking-[0.16em] text-cream/45 uppercase">
                {label}
              </p>
              <p className="mt-2 font-display text-4xl text-brass">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <article className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
        <div className="wrap">
          <div className="mb-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/15 pb-5 text-sm text-ink/60">
            <Link href={`/${lang}/about`} className="text-bronze hover:underline">
              {COMPANY_NAME[lang]}
            </Link>
            <span aria-hidden>·</span>
            <time dateTime={BUYING_GUIDE_PUBLISHED_AT.toISOString()}>
              {new Intl.DateTimeFormat(lang === "ka" ? "ka-GE" : lang === "ru" ? "ru-RU" : "en-GB", {
                dateStyle: "long",
                timeZone: "Asia/Tbilisi",
              }).format(BUYING_GUIDE_PUBLISHED_AT)}
            </time>
          </div>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow eyebrow-on-light">{copy.eyebrow}</p>
              <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-medium md:text-6xl">
                {copy.introTitle}
              </h2>
              <div className="mt-8 max-w-2xl space-y-5 text-[1.02rem] leading-[1.8] text-ink/70">
                {copy.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal className="lg:col-span-5" delayMs={100}>
              <aside className="border border-ink/20 bg-paper p-6 md:p-8">
                <h2 className="font-display text-3xl">{copy.checklistTitle}</h2>
                <ol className="mt-7 border-t border-ink/15">
                  {copy.checklist.map((item, index) => (
                    <li
                      key={item}
                      className="flex gap-4 border-b border-ink/15 py-4 text-sm leading-relaxed text-ink/75"
                    >
                      <span className="font-mono text-[10px] text-bronze">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </aside>
            </Reveal>
          </div>

          <ol className="mt-20 border-t border-ink/20 md:mt-28">
            {copy.steps.map((step, index) => {
              const href = actionHref(step.action, lang);
              const external = step.action === "registry";

              return (
                <li
                  key={step.title}
                  className="grid gap-6 border-b border-ink/20 py-10 md:grid-cols-12 md:gap-10 md:py-14"
                >
                  <div className="md:col-span-2">
                    <span className="font-display text-5xl text-bronze/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="md:col-span-4">
                    <h2 className="font-display text-3xl leading-tight md:text-4xl">
                      {step.title}
                    </h2>
                  </div>
                  <div className="md:col-span-6">
                    <div className="max-w-2xl space-y-4 leading-[1.8] text-ink/70">
                      {step.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    <Link
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="link-slide mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-bronze"
                    >
                      {copy.actions[step.action]}{" "}
                      <span aria-hidden>{external ? "↗" : "→"}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </article>

      <section
        id="buying-from-abroad"
        className="scroll-mt-24 border-t border-cream/10 bg-basalt py-24 text-cream md:py-32"
      >
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{copy.abroadEyebrow}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight font-medium md:text-6xl">
              {copy.abroadTitle}
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-cream/65">
              {copy.abroadLede}
            </p>
            <a
              href={RESIDENCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-slide mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-brass"
            >
              {copy.abroadSource} <span aria-hidden>↗</span>
            </a>
          </Reveal>
          <Reveal className="lg:col-span-7" delayMs={100}>
            <ol className="border-t border-cream/15">
              {copy.abroad.map((point, index) => (
                <li
                  key={point.title}
                  className="grid gap-3 border-b border-cream/15 py-7 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-mono text-[10px] text-brass sm:pt-2">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl leading-snug">
                      {point.title}
                    </h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-cream/65">
                      {point.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="draft-grid bg-ink py-20 md:py-28">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow">{dict.nav.contact}</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-cream md:text-6xl">
              {copy.ctaTitle}
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-cream/65">
              {copy.ctaLede}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 lg:col-span-5 lg:justify-end">
            <Link
              href={inquiryHref(lang)}
              className="inline-flex min-h-12 items-center bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
            >
              {copy.ctaPrimary}
            </Link>
            <Link
              href={`/${lang}/apartments`}
              className="inline-flex min-h-12 items-center border border-cream/25 px-6 text-sm font-semibold text-cream transition-colors hover:border-brass hover:text-brass"
            >
              {copy.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="draft-grid-light bg-paper py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-light">FAQ</p>
            <h2 className="mt-4 font-display text-4xl leading-tight font-medium md:text-6xl">
              {copy.faqTitle}
            </h2>
          </div>
          <div className="border-t border-ink/15 lg:col-span-7">
            {copy.faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-ink/15">
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-lg font-semibold marker:content-none">
                  {faq.question}
                  <span
                    aria-hidden
                    className="font-mono text-2xl font-normal text-bronze transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 leading-relaxed text-ink/65">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
