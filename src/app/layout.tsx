import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { degular, degularDisplay } from "@/assets/fonts";
import "./globals.css";
import { NavigationScrollReset } from "@/components/NavigationScrollReset";
import { SiteAnalytics, LinkedInInsightTag, FacebookPixel } from "@/components/analytics";
import { ConsentProvider, CookieConsentBanner } from "@/components/consent";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  FACEBOOK_PIXEL_ID,
  getFacebookPixelInitScript,
  getFacebookPixelNoscriptUrl,
} from "@/lib/analytics/facebook-pixel-snippet";
import {
  GOOGLE_ADS_ID,
  getGoogleAdsInitScript,
  getGoogleAdsScriptSrc,
} from "@/lib/analytics/google-ads-snippet";
import { getYandexMetrikaNoscriptUrl } from "@/lib/analytics/yandex-metrika-snippet";
import { getResolvedAnalytics } from "@/lib/cms/settings";
import { rootMetadata } from "@/utils/metadata";
import { getGlobalJsonLdGraph } from "@/utils/seo/json-ld";
import { SITE_CONFIG } from "@/utils/consts";
import { WEBVIEW_BOOT_SCRIPT } from "@/utils/webview";

export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // No `viewportFit: cover`: the layout gutter is a fixed --page-padding and
  // does not add env(safe-area-inset-*), so content would sit under the notch.
};

export async function generateMetadata(): Promise<Metadata> {
  const analytics = await getResolvedAnalytics();
  return {
    ...rootMetadata,
    other: {
      ...(typeof rootMetadata.other === "object" && rootMetadata.other
        ? rootMetadata.other
        : {}),
      "theme-color": SITE_CONFIG.themeColor,
      ...(analytics.googleSiteVerification
        ? { "google-site-verification": analytics.googleSiteVerification }
        : {}),
      ...(analytics.yandexWebmasterVerification
        ? { "yandex-verification": analytics.yandexWebmasterVerification }
        : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analytics = await getResolvedAnalytics();
  const metrikaPixel = getYandexMetrikaNoscriptUrl(analytics.yandexMetrikaId);
  const htmlLangHeader = (await headers()).get("x-html-lang");
  const lang = htmlLangHeader === "de" ? "de" : "en";
  const facebookPixelScript = getFacebookPixelInitScript(FACEBOOK_PIXEL_ID);
  const facebookNoscript = getFacebookPixelNoscriptUrl(FACEBOOK_PIXEL_ID);
  const googleAdsScriptSrc = getGoogleAdsScriptSrc(GOOGLE_ADS_ID);
  const googleAdsInitScript = getGoogleAdsInitScript(GOOGLE_ADS_ID);

  return (
    <html
      lang={lang}
      className={`${degular.variable} ${degularDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: WEBVIEW_BOOT_SCRIPT }} />
        {facebookPixelScript ? (
          <script
            id="facebook-pixel"
            dangerouslySetInnerHTML={{ __html: facebookPixelScript }}
          />
        ) : null}
        {googleAdsScriptSrc && googleAdsInitScript ? (
          <>
            <script async src={googleAdsScriptSrc} />
            <script
              id="google-ads-gtag"
              dangerouslySetInnerHTML={{ __html: googleAdsInitScript }}
            />
          </>
        ) : null}
      </head>
      <body className="antialiased">
        {metrikaPixel ? (
          <noscript>
            <div>
              {/* Tracking pixel inside <noscript>: next/image needs JS and
                  would rewrite the URL Metrika expects. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={metrikaPixel}
                style={{ position: "absolute", left: -9999 }}
                alt=""
              />
            </div>
          </noscript>
        ) : null}
        {facebookNoscript ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height={1}
              width={1}
              style={{ display: "none" }}
              alt=""
              src={facebookNoscript}
            />
          </noscript>
        ) : null}
        <JsonLd data={getGlobalJsonLdGraph()} />
        <ConsentProvider>
          {children}
          <NavigationScrollReset />
          <SiteAnalytics />
          <CookieConsentBanner />
        </ConsentProvider>
        <PwaRegister />
        <LinkedInInsightTag />
        <FacebookPixel />
      </body>
    </html>
  );
}
