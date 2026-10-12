import type { Lang } from "./types";

// This is a public Google tag ID, not a credential.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-7MVXJB4KKS";
export const ANALYTICS_CONSENT_KEY = "comfortbuilding.analytics-consent.v1";
export const ANALYTICS_CONSENT_EVENT = "comfortbuilding:analytics-consent";
export type AnalyticsConsent = "granted" | "denied";
let memoryConsent: AnalyticsConsent | null = null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function analyticsReferrer(): string {
  if (typeof document === "undefined" || !document.referrer) return "";
  try { return new URL(document.referrer).origin; } catch { return ""; }
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : memoryConsent;
  } catch {
    return memoryConsent;
  }
}

export function configureAnalytics(consent: AnalyticsConsent) {
  memoryConsent = consent;
  const analyticsWindow = window as unknown as Record<string, unknown>;
  analyticsWindow[`ga-disable-${GA_MEASUREMENT_ID}`] = consent !== "granted";
  if (consent !== "granted" && !window.gtag) return;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    // Google tag commands use the native arguments object from Google's snippet.
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: consent,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: analyticsReferrer(),
    });
  }
  window.gtag("consent", "update", {
    analytics_storage: consent,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export interface ContactEventContext {
  readonly project: string;
  readonly language: Lang;
  readonly placement: string;
  readonly apartment?: string;
}

export function trackContactEvent(
  name: "phone_click" | "inquiry_start" | "generate_lead",
  context: ContactEventContext,
) {
  if (typeof window === "undefined" || readAnalyticsConsent() !== "granted") return;
  window.gtag?.("event", name, {
    project_slug: context.project,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: analyticsReferrer(),
    site_language: context.language,
    contact_placement: context.placement,
    ...(context.apartment ? { apartment_number: context.apartment } : {}),
    ...(name === "generate_lead" ? { lead_source: "website_form" } : {}),
    ...(process.env.NODE_ENV === "development" ? { debug_mode: true } : {}),
  });
}
