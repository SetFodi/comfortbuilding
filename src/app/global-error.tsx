"use client";

import { useEffect } from "react";

const COPY = {
  ka: { title: "საიტი ვერ ჩაიტვირთა", text: "რაღაც შეფერხდა. განაახლეთ გვერდი.", reload: "განახლება", home: "მთავარი" },
  en: { title: "The site couldn't load", text: "Something went wrong. Please reload the page.", reload: "Reload", home: "Home" },
  ru: { title: "Сайт не загрузился", text: "Что-то пошло не так. Обновите страницу.", reload: "Обновить", home: "Главная" },
} as const;

/**
 * Last resort when the root layout itself fails. It replaces the whole
 * document, so it carries its own minimal styling instead of globals.css.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[root]", error.digest ?? "", error);
  }, [error]);

  const segment = typeof window === "undefined" ? "ka" : window.location.pathname.split("/")[1];
  const lang = segment === "en" || segment === "ru" ? segment : "ka";
  const copy = COPY[lang];
  const button = { minHeight: 48, padding: "0 24px", font: "600 14px system-ui, sans-serif", cursor: "pointer", border: 0 } as const;

  return (
    <html lang={lang}>
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0d0f", color: "#f3f0e9", font: "16px/1.6 system-ui, sans-serif" }}>
        <title>Comfort Building</title>
        <main role="alert" style={{ maxWidth: 520, padding: 24 }}>
          <p style={{ margin: 0, color: "#c5aa72", font: "12px ui-monospace, monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>Comfort Building</p>
          <h1 style={{ margin: "16px 0 0", fontSize: 36, fontWeight: 500, lineHeight: 1.15 }}>{copy.title}</h1>
          <p style={{ margin: "16px 0 0", color: "rgba(243,240,233,.65)" }}>{copy.text}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <button type="button" onClick={() => window.location.reload()} style={{ ...button, background: "#c5aa72", color: "#0b0d0f" }}>{copy.reload}</button>
            <a href={`/${lang}`} style={{ ...button, display: "inline-flex", alignItems: "center", color: "#f3f0e9", border: "1px solid rgba(243,240,233,.3)", textDecoration: "none" }}>{copy.home}</a>
          </div>
        </main>
      </body>
    </html>
  );
}
