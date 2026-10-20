"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { trackContactEvent } from "@/lib/analytics";
import { INQUIRY_CONTEXT_EVENT, type InquiryProject } from "@/lib/inquiry-context";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";

const COPY = {
  ka: {
    eyebrow: "დაგვიკავშირდით", title: "რომელი ბინა გაინტერესებთ?",
    lede: "დაგვიტოვეთ საკონტაქტო ინფორმაცია და შეკითხვა. მოთხოვნა პირდაპირ Comfort Building-ის გაყიდვების გუნდს გაეგზავნება.",
    name: "სახელი და გვარი", namePlaceholder: "თქვენი სახელი",
    contact: "ტელეფონი ან ელფოსტა", contactPlaceholder: "+995 ... ან name@email.com",
    project: "პროექტი", anyProject: "პროექტი ჯერ არ შემირჩევია",
    interest: "მოთხოვნის თემა", general: "ზოგადი კონსულტაცია", apartments: "გასაყიდი ბინები", apartment: "ბინა",
    message: "კითხვა ან სასურველი დრო", messagePlaceholder: "მაგალითად: მსურს ბინის ნახვა და გადახდის პირობების გაგება.",
    submit: "მოთხოვნის გაგზავნა", sending: "იგზავნება...", call: "პირდაპირ დარეკვა",
    note: "გაგზავნით ეთანხმებით თქვენი საკონტაქტო ინფორმაციისა და შეტყობინების გაყიდვების გუნდისთვის გადაცემას, მოთხოვნაზე პასუხის გასაცემად. გაგზავნისთვის ვიყენებთ Resend-ს. პირადი ინფორმაცია Google Analytics-ს არ გადაეცემა.",
    success: "თქვენი მოთხოვნა გაგზავნილია", successText: "გაყიდვების გუნდი თქვენ მიერ მითითებულ ტელეფონზე ან ელფოსტაზე დაგიკავშირდებათ.", another: "კიდევ ერთი მოთხოვნა",
    errors: { name: "გთხოვთ მიუთითოთ თქვენი სახელი.", contact: "მიუთითეთ მოქმედი ტელეფონის ნომერი ან ელფოსტა.", message: "შეტყობინება უნდა იყოს მაქსიმუმ 3000 სიმბოლო.", apartment: "გთხოვთ ხელახლა შეარჩიოთ ბინა ან აირჩიოთ ზოგადი კონსულტაცია.", rate_limit: "ბევრი მოთხოვნა გაიგზავნა. სცადეთ 10 წუთში ან დაგვირეკეთ.", unavailable: "მოთხოვნა ვერ გაიგზავნა. თქვენი ინფორმაცია შენარჩუნებულია. სცადეთ ხელახლა ან დაგვირეკეთ." },
  },
  en: {
    eyebrow: "Get in touch", title: "Which apartment interests you?",
    lede: "Leave your contact details and question. Your inquiry goes directly to the Comfort Building sales team.",
    name: "Full name", namePlaceholder: "Your name", contact: "Phone or email", contactPlaceholder: "+995 ... or name@email.com",
    project: "Project", anyProject: "I haven't chosen a project yet",
    interest: "Inquiry topic", general: "General consultation", apartments: "Apartments for sale", apartment: "Apartment",
    message: "Question or preferred time", messagePlaceholder: "For example: I would like to arrange a viewing and ask about payment terms.",
    submit: "Send inquiry", sending: "Sending...", call: "Call directly",
    note: "By sending, you agree to share your contact details and message with the sales team so they can respond. We use Resend to send the message. Personal details are not sent to Google Analytics.",
    success: "Your inquiry has been sent", successText: "The sales team will contact you using the phone number or email you provided.", another: "Send another inquiry",
    errors: { name: "Please enter your name.", contact: "Please enter a valid phone number or email.", message: "Please keep your message within 3,000 characters.", apartment: "Please select the apartment again or choose general consultation.", rate_limit: "Too many inquiries. Please try again in 10 minutes or call us.", unavailable: "Your inquiry could not be sent. Your details are still here. Please try again or call us." },
  },
  ru: {
    eyebrow: "Свяжитесь с нами", title: "Какая квартира вас интересует?",
    lede: "Оставьте контактные данные и вопрос. Запрос отправится напрямую в отдел продаж Comfort Building.",
    name: "Имя и фамилия", namePlaceholder: "Ваше имя", contact: "Телефон или email", contactPlaceholder: "+995 ... или name@email.com",
    project: "Проект", anyProject: "Я ещё не выбрал проект",
    interest: "Тема запроса", general: "Общая консультация", apartments: "Квартиры в продаже", apartment: "Квартира",
    message: "Вопрос или удобное время", messagePlaceholder: "Например: хочу записаться на просмотр и узнать об условиях оплаты.",
    submit: "Отправить запрос", sending: "Отправляется...", call: "Позвонить напрямую",
    note: "Отправляя запрос, вы соглашаетесь передать контактные данные и сообщение отделу продаж для ответа. Для отправки используется Resend. Личные данные не передаются в Google Analytics.",
    success: "Ваш запрос отправлен", successText: "Отдел продаж свяжется с вами по указанному телефону или электронной почте.", another: "Отправить ещё один запрос",
    errors: { name: "Укажите ваше имя.", contact: "Укажите действующий телефон или email.", message: "Сообщение должно содержать не более 3000 символов.", apartment: "Выберите квартиру ещё раз или общую консультацию.", rate_limit: "Слишком много запросов. Попробуйте через 10 минут или позвоните нам.", unavailable: "Не удалось отправить запрос. Ваши данные сохранены в форме. Попробуйте ещё раз или позвоните нам." },
  },
} as const;

const INPUT = "mt-2 min-h-12 w-full border border-cream/20 bg-ink/50 px-4 text-base text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-brass disabled:opacity-50";
const LABEL = "font-mono text-[10px] tracking-[0.14em] text-cream/55 uppercase";

export function LeadInquiryForm({ lang, projects }: { readonly lang: Lang; readonly projects: readonly InquiryProject[] }) {
  const copy = COPY[lang];
  const [projectSlug, setProjectSlug] = useState("general");
  const [interest, setInterest] = useState("apartments");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<keyof typeof copy.errors>("unavailable");
  const pending = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedProject = projects.find((project) => project.slug === query.get("project"));
    const requestedInterest = query.get("interest");
    const number = requestedInterest?.startsWith("apartment-") ? requestedInterest.slice(10) : null;
    const candidates = (requestedProject ? [requestedProject] : projects).flatMap((project) =>
      project.apartments.filter((unit) => unit.number === number).map((unit) => ({ project, unit })),
    );
    const frame = requestAnimationFrame(() => {
      setProjectSlug(requestedProject?.slug ?? "general");
      if (number && candidates.length === 1) {
        setProjectSlug(candidates[0].project.slug);
        setInterest(`apartment-${candidates[0].unit.id}`);
      } else {
        setInterest(requestedInterest === "general" ? "general" : "apartments");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [projects]);

  useEffect(() => {
    if (status === "error" || status === "success") feedback.current?.focus();
  }, [status]);

  const project = projects.find((item) => item.slug === projectSlug);
  const choices = (project ? [project] : projects).flatMap((item) =>
    item.apartments.map((unit) => ({ ...unit, projectSlug: item.slug, projectName: item.name })),
  );

  function selectContext(nextProject: string, nextInterest: string) {
    setProjectSlug(nextProject);
    setInterest(nextInterest);
    const number = projects.find((item) => item.slug === nextProject)?.apartments
      .find((unit) => `apartment-${unit.id}` === nextInterest)?.number;
    const query = new URLSearchParams({ interest: number ? `apartment-${number}` : nextInterest });
    if (nextProject !== "general") query.set("project", nextProject);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}#inquiry`);
    window.dispatchEvent(new Event(INQUIRY_CONTEXT_EVENT));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const unitId = interest.startsWith("apartment-") ? interest.slice(10) : "";
    const payload = {
      name: String(fields.get("name") ?? "").trim(),
      contact: String(fields.get("contact") ?? "").trim(),
      message: String(fields.get("message") ?? "").trim(),
      website: String(fields.get("website") ?? ""),
      projectSlug, unitId, lang,
      topic: unitId ? "apartment" : interest,
    };
    const fingerprint = JSON.stringify(payload);
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
    pending.current = true;
    setStatus("sending");
    try {
      const result = await fetch("/api/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId: request.current.id }),
        signal: AbortSignal.timeout(12_000),
      });
      const data = await result.json();
      if (!result.ok || data.ok !== true) {
        setError(data.error in copy.errors ? data.error : "unavailable");
        setStatus("error");
        return;
      }
      trackContactEvent("generate_lead", {
        project: projectSlug, language: lang, placement: "inquiry-form",
        ...(data.apartmentNumber ? { apartment: data.apartmentNumber } : {}),
      });
      form.reset();
      request.current = null;
      setStatus("success");
    } catch {
      setError("unavailable");
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  return (
    <section id="inquiry" data-project-slug={projectSlug} className="draft-grid bg-ink py-24 text-cream md:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight font-medium md:text-6xl">{copy.title}</h2>
          <p className="mt-6 max-w-lg leading-relaxed text-cream/65">{copy.lede}</p>
          <a href={CONTACT.phoneHref} data-contact-action="inquiry-form-call" className="link-slide mt-8 inline-flex min-h-11 flex-wrap items-center gap-3 font-mono text-lg text-brass">
            {copy.call} · {CONTACT.phoneDisplay}
          </a>
        </div>

        {status === "success" ? (
          <div ref={feedback} tabIndex={-1} role="status" className="flex min-h-80 flex-col justify-center border border-brass/30 bg-basalt/85 p-8 outline-none lg:col-span-7">
            <span aria-hidden="true" className="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-brass text-2xl text-ink">✓</span>
            <h3 className="font-display text-3xl text-brass md:text-4xl">{copy.success}</h3>
            <p className="mt-4 text-sm text-cream/55">{project?.name ?? copy.anyProject}</p>
            <p className="mt-5 max-w-lg leading-relaxed text-cream/75">{copy.successText}</p>
            <button type="button" onClick={() => { started.current = false; setStatus("idle"); }} className="mt-8 min-h-11 self-start border-b border-brass py-2 text-brass">{copy.another} →</button>
          </div>
        ) : (
          <form data-lead-inquiry onSubmit={onSubmit} onFocus={() => {
            if (!started.current) {
              started.current = true;
              trackContactEvent("inquiry_start", { project: projectSlug, language: lang, placement: "inquiry-form" });
            }
          }} aria-busy={status === "sending"} className="border border-cream/15 bg-basalt/85 p-6 md:p-8 lg:col-span-7">
            <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
              <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <fieldset disabled={status === "sending"}>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block"><span className={LABEL}>{copy.name}</span>
                  <input required minLength={2} maxLength={120} name="name" autoComplete="name" placeholder={copy.namePlaceholder} className={INPUT} />
                </label>
                <label className="block"><span className={LABEL}>{copy.contact}</span>
                  <input required maxLength={180} name="contact" autoComplete="tel" placeholder={copy.contactPlaceholder} className={INPUT} />
                </label>
              </div>
              <label className="mt-6 block"><span className={LABEL}>{copy.project}</span>
                <select name="project" value={projectSlug} onChange={(event) => selectContext(event.target.value, "apartments")} className={INPUT}>
                  <option value="general">{copy.anyProject}</option>
                  {projects.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
              </label>
              <label className="mt-6 block"><span className={LABEL}>{copy.interest}</span>
                <select name="interest" value={interest.startsWith("apartment-") ? `apartment-${projectSlug}/${interest.slice(10)}` : interest} onChange={(event) => {
                  const value = event.target.value;
                  const selected = choices.find((unit) => `apartment-${unit.projectSlug}/${unit.id}` === value);
                  selectContext(selected?.projectSlug ?? projectSlug, selected ? `apartment-${selected.id}` : value);
                }} className={INPUT}>
                  <option value="general">{copy.general}</option>
                  <option value="apartments">{copy.apartments}</option>
                  {choices.map((unit) => <option key={`${unit.projectSlug}/${unit.id}`} value={`apartment-${unit.projectSlug}/${unit.id}`}>{copy.apartment} {unit.number}{!project ? ` · ${unit.projectName}` : ""}</option>)}
                </select>
              </label>
              <label className="mt-6 block"><span className={LABEL}>{copy.message}</span>
                <textarea name="message" rows={5} maxLength={3000} placeholder={copy.messagePlaceholder} className={`${INPUT} resize-y py-3`} />
              </label>
              <button type="submit" data-contact-action="send-inquiry" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-5 bg-brass px-6 py-4 font-mono text-xs font-semibold tracking-[0.1em] text-ink transition-colors hover:bg-brass-bright disabled:cursor-wait disabled:opacity-65 sm:w-auto">
                {status === "sending" ? copy.sending : copy.submit}<span aria-hidden="true">→</span>
              </button>
            </fieldset>
            {status === "error" && <div ref={feedback} tabIndex={-1} role="alert" className="mt-6 border-l-2 border-brass bg-ink/60 p-4 text-sm leading-relaxed text-cream outline-none">{copy.errors[error]}</div>}
            <p className="mt-5 max-w-2xl text-xs leading-relaxed text-cream/45">{copy.note}</p>
          </form>
        )}
      </div>
    </section>
  );
}
