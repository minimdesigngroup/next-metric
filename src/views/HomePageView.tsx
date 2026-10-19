import type { Locale } from "@/i18n/config";
import { getLocalePageProps } from "@/i18n/props";
import { SiteLayout } from "@/components/templates";
import {
  MetricHeroSection,
  MetricCategoriesSection,
  MetricCaseStudiesSection,
  MetricServicesSection,
  MetricWorkflowSection,
} from "@/components/organisms/MetricHomeSections";
import { MetricFaqSection } from "@/components/organisms/MetricFaqSection";
import { getMetricHomeResolved } from "@/lib/cms/metric-home";
import { getActiveTags } from "@/lib/cms/tags";

interface HomePageViewProps {
  locale: Locale;
}

export async function HomePageView({ locale }: HomePageViewProps) {
  const [page, home, taxonomy] = await Promise.all([
    getLocalePageProps(locale),
    getMetricHomeResolved(locale),
    getActiveTags(locale),
  ]);

  return (
    <SiteLayout locale={locale} headerVariant="hero">
      <MetricHeroSection locale={locale} home={home} />
      <MetricCategoriesSection locale={locale} home={home} />
      <MetricCaseStudiesSection locale={locale} home={home} taxonomy={taxonomy} />
      <MetricServicesSection locale={locale} home={home} />
      <MetricWorkflowSection locale={locale} home={home} />
      <MetricFaqSection locale={locale} items={page.content.faq} faq={home.faq} />
    </SiteLayout>
  );
}
