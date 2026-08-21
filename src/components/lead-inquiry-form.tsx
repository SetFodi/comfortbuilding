"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";

interface LeadInquiryFormProps {
  readonly lang: Lang;
  readonly apartmentNumbers: readonly string[];
}

const COPY = {
  ka: {
    eyebrow: "მოთხოვნის მომზადება",
    title: "რომელი ბინა გაინტერესებთ?",
    lede: "შეავსეთ მოკლე ფორმა. თქვენი ელფოსტის პროგრამა გახსნის გამზადებულ წერილს Comfort Building-ის გაყიდვების გუნდისთვის.",
    name: "სახელი და გვარი",
    namePlaceholder: "თქვენი სახელი",
    contact: "ტელეფონი ან ელფოსტა",
    contactPlaceholder: "+995 ... ან name@email.com",
    interest: "მოთხოვნის თემა",
    general: "ზოგადი კონსულტაცია",
    apartments: "გასაყიდი ბინები",
    apartment: "ბინა",
    message: "კითხვა ან სასურველი დრო",
    messagePlaceholder: "მაგალითად: მსურს ბინის ნახვა და გადახდის პირობების გაგება.",
    submit: "წერილის მომზადება",
    call: "პირდაპირ დარეკვა",
    note: "ფორმა მონაცემებს საიტზე არ აგზავნის და არ ინახავს. ღილაკი თქვენს ელფოსტის პროგრამაში გამზადებულ წერილს გახსნის, რომელსაც თავად გააგზავნით.",
    ready: "წერილი მომზადებულია. თუ ელფოსტის პროგრამა ავტომატურად არ გაიხსნა, გამოიყენეთ ეს ბმული.",
    open: "ელფოსტის გახსნა",
    subject: "ბინის მოთხოვნა",
    labels: {
      name: "სახელი",
      contact: "საკონტაქტო ინფორმაცია",
      interest: "თემა",
      message: "შეტყობინება",
      page: "გამოგზავნის გვერდი",
    },
  },
  en: {
    eyebrow: "Prepare an inquiry",
    title: "Which apartment interests you?",
    lede: "Complete the short form. Your email app will open a prepared message to the Comfort Building sales team.",
    name: "Full name",
    namePlaceholder: "Your name",
    contact: "Phone or email",
    contactPlaceholder: "+995 ... or name@email.com",
    interest: "Inquiry topic",
    general: "General consultation",
    apartments: "Apartments for sale",
    apartment: "Apartment",
    message: "Question or preferred time",
    messagePlaceholder: "For example: I would like to arrange a viewing and ask about payment terms.",
    submit: "Prepare email",
    call: "Call directly",
    note: "This form does not upload or store your information on the website. The button opens a prepared draft in your email app for you to send.",
    ready: "Your draft is ready. If your email app did not open automatically, use this link.",
    open: "Open email draft",
    subject: "Apartment inquiry",
    labels: {
      name: "Name",
      contact: "Contact details",
      interest: "Topic",
      message: "Message",
      page: "Sent from",
    },
  },
  ru: {
    eyebrow: "Подготовить запрос",
    title: "Какая квартира вас интересует?",
    lede: "Заполните короткую форму. Почтовое приложение откроет готовое письмо для отдела продаж Comfort Building.",
    name: "Имя и фамилия",
    namePlaceholder: "Ваше имя",
    contact: "Телефон или email",
    contactPlaceholder: "+995 ... или name@email.com",
    interest: "Тема запроса",
    general: "Общая консультация",
    apartments: "Квартиры в продаже",
    apartment: "Квартира",
    message: "Вопрос или удобное время",
    messagePlaceholder: "Например: хочу записаться на просмотр и узнать об условиях оплаты.",
    submit: "Подготовить письмо",
    call: "Позвонить напрямую",
    note: "Форма не загружает и не хранит ваши данные на сайте. Кнопка откроет готовый черновик в вашем почтовом приложении, письмо отправляете вы.",
    ready: "Письмо подготовлено. Если почтовое приложение не открылось автоматически, используйте эту ссылку.",
    open: "Открыть письмо",
    subject: "Запрос по квартире",
    labels: {
      name: "Имя",
      contact: "Контактные данные",
      interest: "Тема",
      message: "Сообщение",
      page: "Страница отправки",
    },
  },
} as const;

function fieldValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function LeadInquiryForm({
  lang,
  apartmentNumbers,
}: LeadInquiryFormProps) {
  const copy = COPY[lang];
  const [interest, setInterest] = useState("apartments");
  const [preparedHref, setPreparedHref] = useState<string>();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("interest");
    if (
      requested === "general" ||
      requested === "apartments" ||
      (requested?.startsWith("apartment-") &&
        apartmentNumbers.includes(requested.slice("apartment-".length)))
    ) {
      const frame = window.requestAnimationFrame(() => setInterest(requested));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [apartmentNumbers]);

  const interestLabel =
    interest === "general"
      ? copy.general
      : interest === "apartments"
        ? copy.apartments
        : `${copy.apartment} ${interest.replace("apartment-", "")}`;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = fieldValue(formData, "name");
    const contact = fieldValue(formData, "contact");
    const message = fieldValue(formData, "message");
    const subject = `${copy.subject}: ${interestLabel}`;
    const body = [
      `${copy.labels.name}: ${name}`,
      `${copy.labels.contact}: ${contact}`,
      `${copy.labels.interest}: ${interestLabel}`,
      `${copy.labels.message}: ${message || "-"}`,
      `${copy.labels.page}: ${window.location.href}`,
    ].join("\n\n");
    const href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setPreparedHref(href);
    window.location.href = href;
  };

  return (
    <section
      id="inquiry"
      className="draft-grid bg-ink py-24 text-cream md:py-32"
    >
      <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight font-medium md:text-6xl">
            {copy.title}
          </h2>
          <p className="mt-6 max-w-lg leading-relaxed text-cream/65">
            {copy.lede}
          </p>
          <a
            href={CONTACT.phoneHref}
            data-contact-action="inquiry-form-call"
            className="link-slide mt-8 inline-flex min-h-11 items-center gap-3 font-mono text-lg text-brass"
          >
            {copy.call} · {CONTACT.phoneDisplay}
          </a>
        </div>

        <form
          data-lead-inquiry
          onSubmit={onSubmit}
          className="border border-cream/15 bg-basalt/85 p-6 md:p-8 lg:col-span-7"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-cream/55 uppercase">
                {copy.name}
              </span>
              <input
                required
                name="name"
                autoComplete="name"
                placeholder={copy.namePlaceholder}
                className="mt-2 min-h-12 w-full border border-cream/20 bg-ink/50 px-4 text-base text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-brass"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.14em] text-cream/55 uppercase">
                {copy.contact}
              </span>
              <input
                required
                name="contact"
                autoComplete="tel"
                placeholder={copy.contactPlaceholder}
                className="mt-2 min-h-12 w-full border border-cream/20 bg-ink/50 px-4 text-base text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-brass"
              />
            </label>
          </div>

          <label className="mt-6 block">
            <span className="font-mono text-[10px] tracking-[0.14em] text-cream/55 uppercase">
              {copy.interest}
            </span>
            <select
              name="interest"
              value={interest}
              onChange={(event) => setInterest(event.target.value)}
              className="mt-2 min-h-12 w-full border border-cream/20 bg-ink/50 px-4 text-base text-cream outline-none transition-colors focus:border-brass"
            >
              <option value="general">{copy.general}</option>
              <option value="apartments">{copy.apartments}</option>
              {apartmentNumbers.map((number) => (
                <option key={number} value={`apartment-${number}`}>
                  {copy.apartment} {number}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-6 block">
            <span className="font-mono text-[10px] tracking-[0.14em] text-cream/55 uppercase">
              {copy.message}
            </span>
            <textarea
              name="message"
              rows={5}
              placeholder={copy.messagePlaceholder}
              className="mt-2 w-full resize-y border border-cream/20 bg-ink/50 px-4 py-3 text-base text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-brass"
            />
          </label>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
            <button
              type="submit"
              data-contact-action="prepare-email-inquiry"
              className="inline-flex min-h-12 items-center justify-center bg-brass px-7 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
            >
              {copy.submit} <span className="ml-3" aria-hidden>→</span>
            </button>
            <p className="max-w-md text-xs leading-relaxed text-cream/45">
              {copy.note}
            </p>
          </div>

          {preparedHref ? (
            <p
              role="status"
              className="mt-6 border-t border-cream/15 pt-5 text-sm leading-relaxed text-cream/70"
            >
              {copy.ready}{" "}
              <a
                href={preparedHref}
                data-prepared-inquiry
                className="link-slide font-semibold text-brass"
              >
                {copy.open}
              </a>
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
