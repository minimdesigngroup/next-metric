import { unstable_cache } from "next/cache";
import {
  getMetricHome,
  type MetricHomeContent,
} from "@/data/metric-home";
import type { Locale } from "@/i18n/config";
import { createSupabasePublicClient, hasSupabasePublicConfig } from "@/lib/supabase/public";
import {
  caseStudyItemsFromPayload,
  mergeMetricHome,
} from "@/lib/cms/metric-home-merge";
import {
  coalesceLocalized,
  deepFallbackEmpty,
  pickTranslationRow,
} from "@/lib/cms/locale-fallback";

export type HomeCaseCardFields = {
  slug: string;
  tags: string[];
  quote: string;
  author: string;
  role: string;
  description: string;
  image: string;
  title?: string;
};

type ProjectEnrichment = {
  cover_image: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  author: string | null;
  role: string | null;
  quote: string | null;
};

export { mergeMetricHome };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v ?? "").trim()).filter(Boolean);
}

/**
 * Fill homepage case cards from published `metric_projects`.
 * Home payload only needs `{ slug }` per item — quote/author/role/tags/cover
 * always come from the case itself.
 */
export async function enrichCaseStudiesFromProjects(
  content: MetricHomeContent,
  locale: Locale,
): Promise<MetricHomeContent> {
  const items = [...content.caseStudies.items];
  if (!hasSupabasePublicConfig()) return content;

  const slugs = [
    ...new Set(
      items
        .map((item) => (typeof item?.slug === "string" ? item.slug.trim() : ""))
        .filter(Boolean),
    ),
  ];
  if (slugs.length === 0) return content;

  try {
    const supabase = createSupabasePublicClient();
    if (!supabase) return content;
    const { data, error } = await supabase
      .from("metric_projects")
      .select(
        `slug, cover_image,
         metric_project_translations ( locale, title, description, tags, author, role, quote ),
         metric_project_reviews (
           id, sort_order,
           metric_project_review_translations ( locale, author, role, quote )
         )`,
      )
      .eq("status", "published")
      .in("slug", slugs);

    if (error || !data?.length) return content;

    const bySlug = new Map<string, ProjectEnrichment>();
    for (const row of data) {
      const slug = typeof row.slug === "string" ? row.slug : "";
      if (!slug) continue;
      const translations = Array.isArray(row.metric_project_translations)
        ? row.metric_project_translations
        : [];
      const { primary, en } = pickTranslationRow(translations, locale);
      const match = primary ?? en;

      const reviewRows = Array.isArray(row.metric_project_reviews)
        ? [...row.metric_project_reviews].sort(
            (a: { sort_order?: number }, b: { sort_order?: number }) =>
              (a.sort_order ?? 0) - (b.sort_order ?? 0),
          )
        : [];
      const firstReview = reviewRows[0] as
        | {
            metric_project_review_translations?: Array<{
              locale: string;
              author?: string;
              role?: string;
              quote?: string;
            }>;
          }
        | undefined;
      const reviewTr = pickTranslationRow(
        firstReview?.metric_project_review_translations ?? [],
        locale,
      );

      bySlug.set(slug, {
        cover_image:
          typeof row.cover_image === "string" && row.cover_image.trim()
            ? row.cover_image.trim()
            : null,
        title: coalesceLocalized(primary?.title, en?.title) || null,
        description:
          coalesceLocalized(primary?.description, en?.description) || null,
        tags: asStringArray(
          primary?.tags?.length ? primary.tags : en?.tags?.length ? en.tags : match?.tags,
        ),
        author:
          coalesceLocalized(reviewTr.primary?.author, reviewTr.en?.author) ||
          coalesceLocalized(primary?.author, en?.author) ||
          null,
        role:
          coalesceLocalized(reviewTr.primary?.role, reviewTr.en?.role) ||
          coalesceLocalized(primary?.role, en?.role) ||
          null,
        quote:
          coalesceLocalized(reviewTr.primary?.quote, reviewTr.en?.quote) ||
          coalesceLocalized(primary?.quote, en?.quote) ||
          null,
      });
    }

    if (bySlug.size === 0) return content;

    const enrichedItems = items.map((item) => {
      const slug = typeof item.slug === "string" ? item.slug.trim() : "";
      const project = slug ? bySlug.get(slug) : undefined;
      if (!project) return item;

      const quote = project.quote || project.title || item.quote;
      const author = project.author || project.title || item.author;
      const role = project.role || item.role;
      const itemDescription =
        typeof (item as { description?: unknown }).description === "string"
          ? (item as { description: string }).description.trim()
          : "";
      const description = project.description || itemDescription;
      const image = project.cover_image || item.image;
      const tags = project.tags.length ? project.tags : [...item.tags];

      return {
        slug,
        tags,
        quote,
        author,
        role,
        description,
        image,
        ...(project.title ? { title: project.title } : {}),
      };
    });

    return {
      ...content,
      caseStudies: {
        ...content.caseStudies,
        items: enrichedItems as unknown as MetricHomeContent["caseStudies"]["items"],
      },
    };
  } catch {
    return content;
  }
}

/** Client-side enrich for admin preview (same rules as public). */
export function applyProjectFieldsToCaseItems(
  items: Array<{ slug?: string } & Record<string, unknown>>,
  projectsBySlug: Map<string, HomeCaseCardFields>,
): HomeCaseCardFields[] {
  return items
    .map((item) => {
      const slug = String(item.slug ?? "").trim();
      if (!slug) return null;
      const project = projectsBySlug.get(slug);
      if (project) return { ...project, slug };
      return {
        slug,
        tags: asStringArray(item.tags),
        quote: String(item.quote ?? ""),
        author: String(item.author ?? ""),
        role: String(item.role ?? ""),
        description: String(item.description ?? ""),
        image: String(item.image ?? ""),
      };
    })
    .filter((row): row is HomeCaseCardFields => row != null);
}

async function loadMetricHomePayload(
  locale: Locale,
): Promise<Partial<MetricHomeContent> | null> {
  if (!hasSupabasePublicConfig()) return null;

  try {
    const supabase = createSupabasePublicClient();
    if (!supabase) return null;
    const [homeRes, trRes] = await Promise.all([
      supabase.from("metric_home").select("status").eq("id", 1).maybeSingle(),
      supabase
        .from("metric_home_translations")
        .select("payload")
        .eq("locale", locale)
        .maybeSingle(),
    ]);

    if (homeRes.error || trRes.error) return null;
    if (!homeRes.data || homeRes.data.status !== "published") return null;

    const payload = trRes.data?.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    if (Object.keys(payload as object).length === 0) return null;

    return payload as Partial<MetricHomeContent>;
  } catch {
    return null;
  }
}

async function resolveMetricHome(locale: Locale): Promise<MetricHomeContent> {
  const base = getMetricHome(locale);
  const payload = await loadMetricHomePayload(locale);
  let merged = payload ? mergeMetricHome(base, payload) : base;

  // DE CMS/static gaps → EN (published payload + static defaults).
  if (locale === "de") {
    const enBase = getMetricHome("en");
    const enPayload = await loadMetricHomePayload("en");
    const enMerged = enPayload ? mergeMetricHome(enBase, enPayload) : enBase;
    merged = deepFallbackEmpty(merged, enMerged);
  }

  // Intentional empty lineup must survive DE string fallback (which would
  // otherwise refill `items: []` from EN/static defaults).
  const cmsItems = caseStudyItemsFromPayload(payload);
  if (cmsItems) {
    merged = {
      ...merged,
      caseStudies: {
        ...merged.caseStudies,
        items: cmsItems,
      },
    };
  }

  return enrichCaseStudiesFromProjects(merged, locale);
}

/** Public homepage copy: static defaults merged with published CMS payload. */
export function getMetricHomeResolved(locale: Locale) {
  return unstable_cache(() => resolveMetricHome(locale), [`metric-home-${locale}`], {
    tags: ["cms", "metric-home", "home", "projects", "tags"],
    revalidate: false,
  })();
}
