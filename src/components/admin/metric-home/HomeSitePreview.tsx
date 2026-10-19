"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { AdminSiteScaleFrame } from "@/components/admin/preview/AdminSiteScaleFrame";
import type { MetricHomeSectionId } from "@/components/admin/metric-home/helpers";
import type { ProjectOption } from "@/components/admin/metric-home/MetricHomeSectionEditors";
import type { FaqDraft } from "@/components/admin/list-cms/types";
import type { AdminLocale } from "@/components/admin/ui/locales";
import { adminBtn } from "@/components/admin/ui/styles";
import { ProjectBriefPreviewProvider } from "@/components/molecules/ProjectBriefProvider";
import { Header } from "@/components/organisms/Header";
import {
  MetricCaseStudiesSection,
  MetricCategoriesSection,
  MetricHeroSection,
  MetricServicesSection,
  MetricWorkflowSection,
} from "@/components/organisms/MetricHomeSections";
import { MetricFaqSection } from "@/components/organisms/MetricFaqSection";
import { SiteFooter } from "@/components/organisms/SiteFooter";
import { getMetricHome, type MetricHomeContent } from "@/data/metric-home";
import type { FAQItem } from "@/data/faq";
import { useAdminT } from "@/i18n/admin";
import { getContent } from "@/i18n/get-content";
import { applyProjectFieldsToCaseItems, mergeMetricHome } from "@/lib/cms/metric-home";
import { caseStudyItemsFromPayload } from "@/lib/cms/metric-home-merge";
import { deepFallbackEmpty } from "@/lib/cms/locale-fallback";

type Props = {
  payload: Record<string, unknown>;
  /** EN payload used when `locale` is DE and a string is empty. */
  fallbackPayload?: Record<string, unknown> | null;
  locale: AdminLocale;
  section: MetricHomeSectionId;
  dirty: boolean;
  faq: FaqDraft[];
  projects: ProjectOption[];
  taxonomy?: Array<{ slug: string; en: string; de: string }>;
};

type Device = "desktop" | "mobile";
type Scope = "section" | "page";

/** Sections that map 1:1 onto a public homepage block. */
const SECTION_ORDER: MetricHomeSectionId[] = [
  "hero",
  "categories",
  "case-studies",
  "services",
  "workflow",
  "faq",
];

function previewSectionFor(section: MetricHomeSectionId): MetricHomeSectionId {
  // Trust cards live inside the hero; JSON editing has no single block.
  if (section === "trust") return "hero";
  if (section === "advanced") return "hero";
  return section;
}

function faqItemsFor(faq: FaqDraft[], locale: AdminLocale): FAQItem[] {
  return faq
    .map((item) => {
      const tr = item.translations[locale] ?? item.translations.en;
      return { question: tr?.question ?? "", answer: tr?.answer ?? "" };
    })
    .filter((item) => item.question.trim() || item.answer.trim());
}

export function HomeSitePreview({
  payload,
  fallbackPayload = null,
  locale,
  section,
  dirty,
  faq,
  projects,
  taxonomy = [],
}: Props) {
  const t = useAdminT();
  const [device, setDevice] = useState<Device>("desktop");
  const [scope, setScope] = useState<Scope>("section");
  const siteContent = useMemo(() => getContent(locale), [locale]);

  const home = useMemo(() => {
    let merged = mergeMetricHome(
      getMetricHome(locale),
      payload as Partial<MetricHomeContent>,
    );
    if (locale === "de") {
      const enMerged = mergeMetricHome(
        getMetricHome("en"),
        (fallbackPayload ?? {}) as Partial<MetricHomeContent>,
      );
      merged = deepFallbackEmpty(merged, enMerged);
    }
    const cmsItems = caseStudyItemsFromPayload(payload);
    if (cmsItems) {
      merged = {
        ...merged,
        caseStudies: { ...merged.caseStudies, items: cmsItems },
      };
    }
    const bySlug = new Map(
      projects.map((project) => {
        const tr =
          project.byLocale[locale] ??
          project.byLocale.en ??
          Object.values(project.byLocale)[0];
        const en = project.byLocale.en;
        const title =
          (tr?.title || en?.title || project.title || project.slug).trim();
        return [
          project.slug,
          {
            slug: project.slug,
            tags: (tr?.tags?.length ? tr.tags : en?.tags) ?? [],
            quote: (tr?.quote || en?.quote || title).trim(),
            author: (tr?.author || en?.author || title).trim(),
            role: (tr?.role || en?.role || "").trim(),
            description: (tr?.description || en?.description || "").trim(),
            image: project.cover_image,
            title,
          },
        ] as const;
      }),
    );
    const items = applyProjectFieldsToCaseItems(
      [...merged.caseStudies.items] as Array<{ slug?: string } & Record<string, unknown>>,
      bySlug,
    );
    return {
      ...merged,
      caseStudies: {
        ...merged.caseStudies,
        items: items as unknown as MetricHomeContent["caseStudies"]["items"],
      },
    };
  }, [payload, fallbackPayload, locale, projects]);
  const faqItems = useMemo(() => {
    const fromCms = faqItemsFor(faq, locale);
    if (fromCms.length > 0) return fromCms;
    return siteContent.faq ?? [];
  }, [faq, locale, siteContent.faq]);

  const designWidth = device === "desktop" ? 1440 : 390;
  const viewportWidth = device === "desktop" ? 380 : 280;
  const publicPath = locale === "en" ? "/" : `/${locale}/`;
  const target = previewSectionFor(section);
  const showFullPage = scope === "page" || section === "advanced";

  function renderSection(id: MetricHomeSectionId) {
    switch (id) {
      case "hero":
        return <MetricHeroSection locale={locale} home={home} />;
      case "categories":
        return <MetricCategoriesSection locale={locale} home={home} />;
      case "case-studies":
        return (
          <MetricCaseStudiesSection
            locale={locale}
            home={home}
            taxonomy={taxonomy.map((tag) => ({
              slug: tag.slug,
              label: locale === "de" ? tag.de || tag.en : tag.en,
            }))}
          />
        );
      case "services":
        return <MetricServicesSection locale={locale} home={home} />;
      case "workflow":
        return <MetricWorkflowSection locale={locale} home={home} />;
      case "faq":
        return (
          <MetricFaqSection locale={locale} items={faqItems} faq={home.faq} />
        );
      default:
        return null;
    }
  }

  const chrome = (
    <>
      <Header
        locale={locale}
        site={siteContent.site}
        ui={siteContent.ui}
        variant="hero"
        home={home}
      />
      <div id="site-content">
        <main id="main-content">
          {SECTION_ORDER.map((id) => (
            <Fragment key={id}>{renderSection(id)}</Fragment>
          ))}
        </main>
      </div>
      <SiteFooter locale={locale} content={siteContent} home={home} />
    </>
  );

  const body =
    section === "nav-footer" ? (
      <>
        <Header
          locale={locale}
          site={siteContent.site}
          ui={siteContent.ui}
          variant="hero"
          home={home}
        />
        <div
          aria-hidden
          style={{ minHeight: 120, background: "#f5f5f5" }}
        />
        <SiteFooter locale={locale} content={siteContent} home={home} />
      </>
    ) : showFullPage ? (
      chrome
    ) : (
      renderSection(target)
    );

  return (
    <aside
      style={{
        position: "sticky",
        top: 72,
        alignSelf: "start",
        display: "grid",
        gap: 12,
        width: "100%",
        maxWidth: 420,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ fontSize: 13 }}>{t.pages.home.sitePreview}</strong>
        <div style={{ display: "flex", gap: 6 }}>
          {(["desktop", "mobile"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDevice(mode)}
              style={{
                ...adminBtn,
                padding: "6px 10px",
                fontSize: 12,
                background: device === mode ? "#fff" : "#1a1a1a",
                color: device === mode ? "#000" : "#fff",
              }}
            >
              {mode === "desktop" ? "Desktop" : "Mobile"}
            </button>
          ))}
        </div>
      </div>

      {section !== "nav-footer" && section !== "advanced" ? (
        <div style={{ display: "flex", gap: 6 }}>
          {(
            [
              ["section", t.pages.home.previewSectionOnly],
              ["page", t.pages.home.previewFullPage],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              style={{
                ...adminBtn,
                padding: "6px 10px",
                fontSize: 12,
                background: scope === id ? "#fff" : "#1a1a1a",
                color: scope === id ? "#000" : "#fff",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {dirty ? (
        <p
          style={{
            margin: 0,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#3a2a00",
            border: "1px solid #a67c00",
            color: "#f5d78e",
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          {t.pages.home.previewUnsaved}
        </p>
      ) : null}

      <div className="admin-site-preview__scroll" style={{ maxHeight: 640, overflow: "auto" }}>
        <AdminSiteScaleFrame
          key={`${device}-${showFullPage ? "page" : "section"}-${section}`}
          designWidth={designWidth}
          viewportWidth={viewportWidth}
          className={[
            "admin-site-preview--home",
            showFullPage || section === "nav-footer"
              ? "admin-site-preview--home-full"
              : "",
            device === "desktop"
              ? "admin-site-preview--home-desktop"
              : "admin-site-preview--home-mobile",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ProjectBriefPreviewProvider>{body}</ProjectBriefPreviewProvider>
        </AdminSiteScaleFrame>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <Link
          href={publicPath}
          target="_blank"
          rel="noreferrer"
          style={{ ...adminBtn, textDecoration: "none", justifySelf: "start" }}
        >
          {t.pages.project.openOnSite} →
        </Link>
        <span style={{ fontSize: 11, color: "#777", lineHeight: 1.35 }}>
          {t.pages.home.previewHint}
        </span>
      </div>
    </aside>
  );
}
