/** Google Ads gtag — static ID for metric.graphics. Must be a raw
 *  <script> in <head> so the tag is present on every page HTML. */
export const GOOGLE_ADS_ID = "AW-18440452950";

export function getGoogleAdsInitScript(adsId: string): string {
  const id = adsId.trim();
  if (!id) return "";

  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
`.trim();
}

export function getGoogleAdsScriptSrc(adsId: string): string {
  const id = adsId.trim();
  if (!id) return "";
  return `https://www.googletagmanager.com/gtag/js?id=${id}`;
}
