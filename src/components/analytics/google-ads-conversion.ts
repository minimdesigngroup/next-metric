"use client";

/** Google Ads conversion — lead / brief thank-you. */
export const GOOGLE_ADS_CONVERSION_SEND_TO = "AW-18440452950/Qm9JCKyl8_QcENb2i9lE";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire Google Ads conversion only after a successful lead submit
 * (when the thank-you UI is shown) — never on raw Submit click.
 */
export function trackGoogleAdsLeadConversion(): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", "conversion", {
      send_to: GOOGLE_ADS_CONVERSION_SEND_TO,
      value: 1.0,
      currency: "USD",
    });
  } catch {
    // gtag may be blocked; never break the thank-you flow.
  }
}
