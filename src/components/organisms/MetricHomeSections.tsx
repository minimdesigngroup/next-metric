import Image from "next/image";
import { Button } from "@/components/atoms/Button";
import { MediaImage } from "@/components/atoms/MediaImage";
import { LiquidGlassPlaque } from "@/components/atoms/LiquidGlassPlaque";
import { ProjectBriefCta } from "@/components/molecules/ProjectBriefCta";
import { PageContainer } from "@/components/atoms/PageContainer";
import { CategoriesMarquee } from "@/components/molecules/CategoriesMarquee";
import { MetricCaseCard } from "@/components/molecules/MetricCaseCard";
import type { MetricHomeContent } from "@/data/metric-home";
import type { Locale } from "@/i18n/config";
import { localePath, localeBriefHref } from "@/i18n/paths";
import {
  resolveTagDisplays,
  type TagDisplaySource,
} from "@/utils/tag-labels";

const WORKFLOW_IMAGE_SIZE: Record<string, readonly [number, number]> = {
  "/images/metric/workflow/wf-1.png": [820, 518],
  "/images/metric/workflow/wf-2.png": [772, 498],
  "/images/metric/workflow/wf-3.png": [812, 590],
};

function workflowImageSize(src: string): readonly [number, number] {
  return WORKFLOW_IMAGE_SIZE[src] ?? [820, 518];
}

function MetricTrustCards({ trust }: { trust: MetricHomeContent["trust"] }) {
  return (
    <div className="metric-hero__trust">
      {trust.map((item, index) => (
        <LiquidGlassPlaque
          key={`${item.kind}-${"value" in item ? item.value : "label" in item ? item.label : index}`}
          className={`metric-hero__trust-card metric-hero__trust-card--${item.kind}`}
        >
          <div className="metric-hero__trust-inner">
            {item.kind === "spn" ? (
              <>
                <p className="metric-hero__trust-kicker">{item.label}</p>
                <div className="metric-hero__trust-spn">
                  <Image
                    src={item.icon}
                    alt="Amazon SPN"
                    width={160}
                    height={48}
                    className="h-12 w-auto object-contain object-left"
                  />
                </div>
                <p className="metric-hero__trust-copy">{item.text}</p>
              </>
            ) : null}

            {item.kind === "reviews" ? (
              <>
                <div className="metric-hero__trust-icon">
                  <Image
                    src={item.icon}
                    alt="Trustpilot"
                    width={56}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="metric-hero__trust-copy metric-hero__trust-copy--bottom">
                  {item.label}
                </p>
              </>
            ) : null}

            {item.kind === "rating" ? (
              <>
                <p className="metric-hero__trust-value">
                  {item.value}
                  <Image
                    src="/images/metric/icons/star.svg"
                    alt="5 star rating"
                    width={41}
                    height={39}
                    className="metric-hero__trust-star"
                  />
                </p>
                <p className="metric-hero__trust-copy metric-hero__trust-copy--bottom">
                  {item.labelLine1}
                  <br />
                  {item.labelLine2}
                </p>
              </>
            ) : null}

            {item.kind === "stat" ? (
              <>
                <p className="metric-hero__trust-value">{item.value}</p>
                <p className="metric-hero__trust-copy metric-hero__trust-copy--bottom">
                  {item.labelLine1}
                  <br />
                  {item.labelLine2}
                </p>
              </>
            ) : null}
          </div>
        </LiquidGlassPlaque>
      ))}
    </div>
  );
}

const HERO_BLOBS = [
  "metric-hero-blob metric-hero-blob--a",
  "metric-hero-blob metric-hero-blob--b",
  "metric-hero-blob metric-hero-blob--c",
] as const;

export function MetricHeroSection({
  locale,
  home,
}: {
  locale: Locale;
  home: MetricHomeContent;
}) {
  const { hero } = home;
  const briefHref = localeBriefHref(locale);

  return (
    <section
      className="metric-hero"
      aria-label="Hero"
      data-blobs-section
    >
      <div className="metric-hero__blobs" aria-hidden>
        {HERO_BLOBS.map((className) => (
          <div key={className} data-blob className={className} />
        ))}
      </div>

      <PageContainer className="metric-hero__shell">
        <div className="metric-hero__main">
          <div className="metric-hero__copy">
            <h1 className="metric-hero__title font-display">
              <span className="block">{hero.titleLine1}</span>
              <span className="block">{hero.titleLine2}</span>
            </h1>
            <p className="metric-hero__subtitle">{hero.subtitle}</p>
            <ProjectBriefCta href={briefHref} variant="primary" size="lg">
              {hero.cta}
            </ProjectBriefCta>
          </div>

          <div className="metric-hero__visual">
            <div className="metric-hero__cluster">
              <div className="metric-hero__cluster-shot">
                <MediaImage
                  src="/images/metric/hero/cluster.png"
                  alt="Amazon listing images and A+ Content product photography examples"
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>

              <div className="metric-hero__badge">
                <LiquidGlassPlaque className="metric-hero__plaque">
                  <div className="metric-hero__badge-inner">
                    <p className="metric-hero__badge-value">{hero.badgeValue}</p>
                    <p className="metric-hero__badge-label">{hero.badgeLabel}</p>
                  </div>
                </LiquidGlassPlaque>
              </div>

              <div className="metric-hero__redesign-tag">
                <div className="metric-hero__redesign-tag-glass">
                  <LiquidGlassPlaque
                    className="metric-hero__plaque"
                    background="linear-gradient(90deg, #edd6e8, #f6d5c9)"
                  />
                </div>
                <span>{hero.redesignLabel}</span>
              </div>
              <div className="metric-hero__redesign-card">
                <p className="metric-hero__redesign-value">{hero.redesignValue}</p>
                <p className="metric-hero__redesign-delta">{hero.redesignDelta}</p>
                <p className="metric-hero__redesign-caption">{hero.redesignCaption}</p>
              </div>
            </div>
          </div>
        </div>

        <MetricTrustCards trust={home.trust} />
      </PageContainer>
    </section>
  );
}

export function MetricCategoriesSection({
  home,
}: {
  locale?: Locale;
  home: MetricHomeContent;
}) {
  const { categories } = home;
  return (
    <section id="projects" className="metric-gradient-pink metric-section metric-categories">
      <PageContainer>
        <h2
          className="metric-categories__title font-display text-white"

        >
          {categories.titleLines.map((line, index) => {
            if (typeof line === "string") {
              return (
                <span key={index} className="metric-categories__title-line">
                  {line}
                </span>
              );
            }

            return (
              <span
                key={index}
                className={
                  line.icon
                    ? "metric-categories__title-line metric-categories__title-line--with-icon"
                    : "metric-categories__title-line"
                }
              >
                {line.prefix}
                <span className="metric-categories__accent text-accent">
                  {line.accent}
                  {line.icon ? (
                    <Image
                      src="/images/metric/icons/arrow.svg"
                      alt="Amazon bestsellers"
                      width={94}
                      height={80}
                      className="metric-categories__laurel"
                    />
                  ) : null}
                </span>
                {line.suffix}
              </span>
            );
          })}
        </h2>
      </PageContainer>

      <CategoriesMarquee images={categories.images} />
    </section>
  );
}

export function MetricCaseStudiesSection({
  locale,
  home,
  taxonomy = [],
}: {
  locale: Locale;
  home: MetricHomeContent;
  taxonomy?: readonly TagDisplaySource[];
}) {
  const { caseStudies } = home;
  if (!caseStudies.items.length) return null;

  const titleParts = caseStudies.title.split(caseStudies.titleAccent);

  return (
    <section id="case-studies" className="metric-section metric-case-studies">
      <PageContainer>
        <div className="metric-case-studies__header">
          <h2 className="metric-case-studies__title font-display">
            {titleParts[0]}
            <span className="text-accent">{caseStudies.titleAccent}</span>
            {titleParts[1] ?? ""}
          </h2>
          <p className="metric-case-studies__subtitle">{caseStudies.subtitle}</p>
        </div>

        <div
          className="metric-case-studies__list"
        >
          {caseStudies.items.map((item) => {
            const tags = resolveTagDisplays(item.tags, taxonomy);
            const name = item.title?.trim() || item.author || item.slug;
            return (
              <MetricCaseCard
                key={item.slug}
                locale={locale}
                href={localePath(locale, `/works/${item.slug}/`)}
                tags={tags}
                title={name}
                description={item.description}
                image={item.image}
                imageAlt={`${name} — ${tags
                  .slice(0, 2)
                  .map((tag) => tag.label)
                  .join(", ") || "Amazon case study"}`}
                viewLabel={caseStudies.viewLabel}
              />
            );
          })}
        </div>

        <div className="metric-case-studies__more">
          <Button href={localePath(locale, "/works/")} variant="outline">
            {caseStudies.moreLabel}
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}

export function MetricServicesSection({
  locale,
  home,
}: {
  locale: Locale;
  home: MetricHomeContent;
}) {
  const { services } = home;
  const briefHref = localeBriefHref(locale);
  return (
    <section id={services.id} className="metric-services">
      <PageContainer className="metric-services__inner">
        <h2 className="metric-services__title font-display">
          {services.titleLines.map((line) => (
            <span key={line} className="metric-services__title-line">
              {line}
            </span>
          ))}
          <span className="metric-services__title-line metric-services__title-line--end">
            {services.titleSuffix ? (
              <span className="metric-services__title-suffix">
                {/* Breakable space (not nbsp) — lets "suffix [bracket]" wrap
                    onto separate lines on narrow phones instead of forcing
                    overflow; desktop's white-space: nowrap keeps them glued
                    where there's room. */}
                {services.titleSuffix}{" "}
              </span>
            ) : null}
            <span className="metric-services__bracket">{services.titleBracket}</span>
          </span>
        </h2>

        <div className="metric-services__layout">
          <div className="metric-services__pin">
            <p className="metric-services__subtitle">
              {services.subtitle}
            </p>
            <div className="metric-services__cta">
              <ProjectBriefCta href={briefHref} variant="onAccent">
                {services.cta}
              </ProjectBriefCta>
            </div>
          </div>

          <div
            className="metric-services__list"


          >
            {services.items.map((item) => (
              <article key={item.n} className="metric-services-card">
                <div className="metric-services-card__head">
                  <span className="metric-services-card__num" aria-hidden>
                    {item.n}
                  </span>
                  <Button
                    as="span"
                    variant="onAccent"
                    size="lg"
                    className="metric-services-card__label"
                  >
                    {item.title}
                  </Button>
                </div>
                <div className="metric-services-card__media">
                  <MediaImage
                    src={item.image}
                    alt={`${item.title} — Amazon deliverable example`}
                    fill
                    className="metric-services-card__img"
                    sizes="(max-width: 1024px) 90vw, (max-width: 1799px) 70vw, (max-width: 2559px) min(55vw, 1200px), min(50vw, 1600px)"
                    quality={75}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function MetricWorkflowSection({
  locale,
  home,
}: {
  locale: Locale;
  home: MetricHomeContent;
}) {
  const { workflow } = home;
  const briefHref = localeBriefHref(locale);
  return (
    <section id={workflow.id} className="metric-section metric-workflow">
      <PageContainer>
        <div className="metric-workflow__header">
          <h2 className="metric-workflow__title font-display text-foreground">
            <span className="metric-workflow__title-line">{workflow.titleLine1}</span>
            <span className="metric-workflow__title-line metric-workflow__title-line--brand">
              <Image
                src="/images/metric/icons/metric-m.svg"
                alt="METRIC"
                width={123}
                height={95}
                className="metric-workflow__mark"
              />
              <span>{workflow.titleLine2}</span>
            </span>
          </h2>
          <p className="metric-workflow__subtitle">{workflow.subtitle}</p>
        </div>

        <div
          className="metric-workflow__grid"


        >
          {workflow.cards.map((card, index) => {
            const [imgW, imgH] = workflowImageSize(card.image);
            const media = (
              <div className="metric-workflow-card__media">
                <MediaImage
                  src={card.image}
                  alt={card.title}
                  width={imgW}
                  height={imgH}
                  className="metric-workflow-card__img"
                  sizes="(max-width: 1024px) 90vw, 33vw"
                  quality={75}
                />
              </div>
            );
            const copy = (
              <div className="metric-workflow-card__copy">
                <h3 className="metric-workflow-card__title font-display">{card.title}</h3>
                <p className="metric-workflow-card__body">{card.body}</p>
              </div>
            );

            return (
              <article
                key={card.title}
                className={`metric-workflow-card metric-workflow-card--${card.layout}${
                  index === 1 ? " metric-workflow-card--offset" : ""
                }`}

              >
                {card.layout === "media-bottom" ? (
                  <>
                    {copy}
                    {media}
                  </>
                ) : (
                  <>
                    {media}
                    {copy}
                  </>
                )}
              </article>
            );
          })}
        </div>

        <div className="metric-workflow__cta">
          <p className="metric-workflow__note">{workflow.note}</p>
          <ProjectBriefCta href={briefHref} variant="primary">
            {workflow.cta}
          </ProjectBriefCta>
        </div>
      </PageContainer>
    </section>
  );
}
