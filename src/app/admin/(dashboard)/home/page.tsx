import { requirePermission } from "@/lib/cms/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMetricHome, toMetricHomePayload } from "@/data/metric-home";
import { MetricHomeAdmin } from "@/components/admin/page-shell/MetricHomeAdmin";
import type { ProjectOption } from "@/components/admin/metric-home/MetricHomeSectionEditors";
import {
  ADMIN_LOCALES,
  type FaqDraft,
} from "@/components/admin/list-cms/types";
import { EMBED } from "@/lib/cms/embeds";
import { getAdminTags } from "@/lib/cms/tags";

function toFaqDraft(row: {
  id: string;
  sort_order: number;
  status: string;
  faq_translations?: Array<{ locale: string; question: string; answer: string }>;
}): FaqDraft {
  const translations = Object.fromEntries(
    ADMIN_LOCALES.map((locale) => {
      const tr = row.faq_translations?.find((t) => t.locale === locale.code);
      return [
        locale.code,
        {
          locale: locale.code,
          question: tr?.question ?? "",
          answer: tr?.answer ?? "",
        },
      ];
    }),
  ) as FaqDraft["translations"];

  return {
    id: row.id,
    sort_order: row.sort_order,
    status: row.status,
    translations,
  };
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    saved?: string;
    edit?: string;
  }>;
}) {
  await requirePermission("content");
  const params = await searchParams;
  const section = params.section ?? "hero";
  const supabase = createSupabaseAdminClient();

  // Always load FAQ — full-page site preview needs items on every section.
  const [{ data: home }, { data: translations }, { data: projectRows }, faqRes, adminTags] =
    await Promise.all([
      supabase.from("metric_home").select("status").eq("id", 1).maybeSingle(),
      supabase.from("metric_home_translations").select("locale, payload"),
      supabase
        .from("metric_projects")
        .select(`id, slug, status, cover_image, ${EMBED.projectTranslations}`)
        .order("sort_order"),
      supabase
        .from("metric_faq_items")
        .select(`*, ${EMBED.faqTranslations}`)
        .order("sort_order"),
      getAdminTags(),
    ]);

  const byLocale = Object.fromEntries(
    (translations ?? []).map((row) => [row.locale, row.payload]),
  ) as Record<string, unknown>;

  const enPayload =
    byLocale.en && typeof byLocale.en === "object"
      ? (byLocale.en as Record<string, unknown>)
      : toMetricHomePayload(getMetricHome("en"));
  const dePayload =
    byLocale.de && typeof byLocale.de === "object"
      ? (byLocale.de as Record<string, unknown>)
      : toMetricHomePayload(getMetricHome("de"));

  const projects = (projectRows ?? [])
    .filter((row) => row.slug)
    .map((row) => {
      const translationsList = Array.isArray(row.project_translations)
        ? row.project_translations
        : [];
      const byLocale: ProjectOption["byLocale"] = {};
      for (const tr of translationsList) {
        const loc = String(tr?.locale ?? "").trim();
        if (!loc) continue;
        byLocale[loc] = {
          title: String(tr?.title ?? "").trim(),
          description: String(tr?.description ?? "").trim(),
          tags: Array.isArray(tr?.tags)
            ? tr.tags.map((tag: unknown) => String(tag ?? "").trim()).filter(Boolean)
            : [],
          author: String(tr?.author ?? "").trim(),
          role: String(tr?.role ?? "").trim(),
          quote: String(tr?.quote ?? "").trim(),
        };
      }
      const enTitle = byLocale.en?.title;
      const anyTitle = Object.values(byLocale)[0]?.title;
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(enTitle || anyTitle || row.slug),
        status: String(row.status ?? "draft"),
        cover_image: String(row.cover_image ?? "").trim(),
        byLocale,
      };
    });

  const faq = (faqRes.data ?? []).map(toFaqDraft);

  return (
    <MetricHomeAdmin
      section={section}
      status={(home?.status as "draft" | "published") ?? "published"}
      payloads={{ en: enPayload, de: dePayload }}
      projects={projects}
      taxonomy={adminTags.map((tag) => ({
        slug: tag.slug,
        en: tag.labels.en,
        de: tag.labels.de,
      }))}
      faq={faq}
      faqEditId={params.edit ?? null}
      saved={Boolean(params.saved)}
    />
  );
}
