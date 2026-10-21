"use client";

import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";
import { trackClientError } from "@/lib/analytics";

/** Keeps a record of what failed in the browser console for support. */
function LogError({ error, area }: { readonly error: Error; readonly area: string }) {
  useEffect(() => {
    console.error(`[${area}]`, error);
    trackClientError(area, error);
  }, [area, error]);
  return null;
}

interface ViewBoundaryProps {
  /** Short name for the console log, such as "apartment-3d". */
  readonly area: string;
  readonly message: string;
  readonly retryLabel: string;
  readonly tone?: "dark" | "light";
}

function ViewFallback({ area, message, retryLabel, tone = "dark" }: ViewBoundaryProps, { error, reset }: ErrorInfo) {
  const dark = tone === "dark";
  return (
    <div role="alert" data-view-error={area}
      className={`flex h-full min-h-60 flex-col items-center justify-center gap-5 px-6 py-10 text-center ${dark ? "bg-basalt text-cream" : "bg-paper text-ink"}`}>
      <LogError error={error instanceof Error ? error : new Error(String(error))} area={area} />
      <p className={`max-w-sm text-sm leading-relaxed ${dark ? "text-cream/70" : "text-ink/70"}`}>{message}</p>
      <button type="button" onClick={() => reset()}
        className={`inline-flex min-h-11 items-center gap-2 px-5 text-sm font-semibold transition-colors ${dark ? "bg-brass text-ink hover:bg-brass-bright" : "bg-ink text-cream hover:bg-iron"}`}>
        <span aria-hidden>↻</span> {retryLabel}
      </button>
    </div>
  );
}

/**
 * Contains a failure to the part of the page that broke. A 3D view that
 * fails on some device shows a short message with a retry button, and the
 * rest of the page keeps working.
 */
export const ViewBoundary = catchError(ViewFallback);
