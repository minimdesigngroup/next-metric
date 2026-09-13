"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/types";
import type { PublicCaptchaConfig } from "@/lib/cms/settings";
import {
  trackGoogleAdsLeadConversion,
  trackLinkedInLeadConversion,
} from "@/components/analytics";
import { ProjectBriefForm } from "@/components/molecules/ProjectBriefForm";

function subscribeNever() {
  return () => undefined;
}

/** Mounted only while open — closing unmounts and resets the success state. */
export function ProjectBriefModal({
  onClose,
  locale,
  ui,
  captcha,
  brief,
}: {
  onClose: () => void;
  locale: Locale;
  ui: SiteContent["ui"];
  captcha: PublicCaptchaConfig;
  brief: SiteContent["projectBrief"];
}) {
  const titleId = useId();
  const [submitted, setSubmitted] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("project-brief-open");
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("project-brief-open");
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!submitted) return;
    trackLinkedInLeadConversion();
    trackGoogleAdsLeadConversion();
  }, [submitted]);

  if (!mounted) return null;

  return createPortal(
    <div className="project-brief">
      <button
        type="button"
        className="project-brief__backdrop"
        aria-label={brief.closeLabel}
        onClick={onClose}
      />
      <div
        className="project-brief__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="project-brief__close"
          aria-label={brief.closeLabel}
          onClick={onClose}
        >
          <Image
            src="/images/metric/case-detail/imgGroup1328.svg"
            alt=""
            width={64}
            height={64}
            unoptimized
          />
        </button>
        <div
          className={
            submitted
              ? "project-brief__panel project-brief__panel--success"
              : "project-brief__panel"
          }
        >
          {submitted ? (
            <div className="project-brief__success" role="status">
              <h2 id={titleId} className="project-brief__success-title font-display">
                {brief.successTitle}
              </h2>
              <div className="project-brief__success-mark" aria-hidden>
                <Image
                  src="/images/metric/icons/metric-m.svg"
                  alt=""
                  width={520}
                  height={400}
                  unoptimized
                />
              </div>
              <p className="project-brief__success-body">{brief.successBody}</p>
            </div>
          ) : (
            <>
              <header className="project-brief__intro">
                <h2 id={titleId} className="project-brief__title font-display">
                  {brief.title}
                </h2>
                <p className="project-brief__subtitle">{brief.subtitle}</p>
              </header>
              <ProjectBriefForm
                locale={locale}
                ui={ui}
                captcha={captcha}
                brief={brief}
                onSuccess={() => setSubmitted(true)}
              />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
