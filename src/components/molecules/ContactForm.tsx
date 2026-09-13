"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import Script from "next/script";
import { Button } from "@/components/atoms/Button";
import type { SiteContent } from "@/i18n/types";
import type { PublicCaptchaConfig } from "@/lib/cms/settings";
import {
  formatFileSize,
  getLeadFileKind,
  LeadFileTypeIcon,
} from "@/components/molecules/LeadFileTypeIcon";
import { trackGoogleAdsLeadConversion } from "@/components/analytics";

interface ContactFormProps {
  ui: SiteContent["ui"];
  className?: string;
  buttonAlign?: "left" | "right";
  variant?: "section" | "page";
  locale?: string;
  captcha?: PublicCaptchaConfig;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
    hcaptcha?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type FieldKey = "name" | "phone" | "message";

export function ContactForm({
  ui,
  className = "",
  buttonAlign = "right",
  variant = "section",
  locale,
  captcha = { provider: "none", siteKey: "" },
}: ContactFormProps) {
  const fileInputId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "sending">("idle");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [consent, setConsent] = useState(false);
  const [values, setValues] = useState({ name: "", phone: "", message: "" });
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false,
    phone: false,
    message: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const widgetHostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!submitted) return;
    trackGoogleAdsLeadConversion();
  }, [submitted]);

  useEffect(() => {
    if (!captcha.siteKey || !widgetHostRef.current) return;
    if (captcha.provider !== "turnstile" && captcha.provider !== "hcaptcha") {
      return;
    }

    const render = () => {
      if (!widgetHostRef.current || widgetIdRef.current) return;
      if (captcha.provider === "turnstile" && window.turnstile) {
        widgetIdRef.current = window.turnstile.render(widgetHostRef.current, {
          sitekey: captcha.siteKey,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      }
      if (captcha.provider === "hcaptcha" && window.hcaptcha) {
        widgetIdRef.current = window.hcaptcha.render(widgetHostRef.current, {
          sitekey: captcha.siteKey,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      }
    };

    render();
    const timer = window.setInterval(render, 400);
    return () => window.clearInterval(timer);
  }, [captcha.provider, captcha.siteKey]);

  const updateField = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (submitted) setSubmitted(false);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    const form = event.currentTarget;

    if (
      (captcha.provider === "turnstile" || captcha.provider === "hcaptcha") &&
      !captchaToken
    ) {
      setError(ui.captchaRequired);
      setLoading(false);
      return;
    }

    if (!consent) {
      setError(ui.consentRequired);
      setLoading(false);
      return;
    }

    try {
      setPhase(file ? "uploading" : "sending");
      const body = new FormData();
      body.set("name", values.name.trim());
      body.set("phone", values.phone.trim());
      body.set("message", values.message.trim());
      body.set("locale", locale ?? "");
      body.set("consent", String(consent));
      body.set("captchaToken", captchaToken);
      body.set("website", String(new FormData(form).get("website") || ""));
      if (file) body.set("file", file);

      setPhase("sending");
      const response = await fetch("/api/leads/", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Request failed");
      }

      setSubmitted(true);
      setValues({ name: "", phone: "", message: "" });
      setTouched({ name: false, phone: false, message: false });
      setConsent(false);
      clearFile();
      form.reset();
      setCaptchaToken("");
      if (widgetIdRef.current) {
        window.turnstile?.reset(widgetIdRef.current);
        window.hcaptcha?.reset(widgetIdRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  };

  const formClassName = [
    variant === "section" ? "contact-form" : "contact-form contact-form--page",
    buttonAlign === "left" ? "contact-form--button-left" : "",
    submitted ? "contact-form--success" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fieldClass = (key: FieldKey) => {
    const filled = values[key].trim().length > 0;
    return [
      "contact-form__field",
      key === "message" ? "contact-form__field--message" : "",
      filled ? "is-filled" : "",
      touched[key] ? "is-touched" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const statusLabel = submitted
    ? ui.submitted
    : phase === "uploading"
      ? ui.fileUploading
      : loading
        ? ui.sending
        : ui.send;

  return (
    <form
      onSubmit={handleSubmit}
      className={formClassName}
    >
      {captcha.provider === "turnstile" ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
        />
      ) : null}
      {captcha.provider === "hcaptcha" ? (
        <Script src="https://js.hcaptcha.com/1/api.js?render=explicit" strategy="lazyOnload" />
      ) : null}

      <label
        className="sr-only"
        aria-hidden
        style={{ position: "absolute", left: "-9999px" }}
      >
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className={fieldClass("name")}>
        {ui.name}
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          className="contact-form__input ui-input"
        />
      </label>

      <label className={fieldClass("phone")}>
        {ui.phone}
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          required
          value={values.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          className="contact-form__input ui-input"
        />
      </label>

      <label className={fieldClass("message")}>
        {ui.describeProject}
        <textarea
          name="message"
          rows={1}
          required
          value={values.message}
          onChange={(e) => updateField("message", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, message: true }))}
          className="contact-form__input contact-form__input--textarea ui-input"
        />
      </label>

      <div className="contact-form__upload-wrap">
        {!file ? (
          <label className="contact-form__upload ui-file" htmlFor={fileInputId}>
            <Image
              src="/images/decor/upload.svg"
              alt=""
              width={24}
              height={24}
              aria-hidden
            />
            <span>{ui.attachFile}</span>
          </label>
        ) : (
          <div
            className={`contact-form__file-card is-${getLeadFileKind(file)}`}
            data-status={loading ? phase : "ready"}
          >
            <div className="contact-form__file-preview">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="contact-form__file-thumb"
                />
              ) : (
                <LeadFileTypeIcon kind={getLeadFileKind(file)} />
              )}
            </div>
            <div className="contact-form__file-meta">
              <p className="contact-form__file-name">{file.name}</p>
              <p className="contact-form__file-sub">
                {phase === "uploading" || (loading && file)
                  ? ui.fileUploading
                  : `${ui.fileAttached} · ${formatFileSize(file.size)}`}
              </p>
              {(phase === "uploading" || loading) && file ? (
                <div
                  className="contact-form__file-progress"
                  aria-hidden
                >
                  <span />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="contact-form__file-remove"
              onClick={clearFile}
              disabled={loading}
            >
              {ui.removeFile}
            </button>
          </div>
        )}
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          name="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.odt,.rtf,.txt,image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={onFileChange}
        />
      </div>

      {(captcha.provider === "turnstile" || captcha.provider === "hcaptcha") &&
      captcha.siteKey ? (
        <div ref={widgetHostRef} className="contact-form__captcha" />
      ) : null}

      <label className="contact-form__consent">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (submitted) setSubmitted(false);
          }}
          required
        />
        <span>
          {ui.consentPrefix}{" "}
          <a
            href={locale === "de" ? "/de/privacy/" : "/privacy/"}
            target="_blank"
            rel="noreferrer"
            className="contact-form__consent-link"
          >
            {ui.consentLinkLabel}
          </a>
          {ui.consentSuffix ? ` ${ui.consentSuffix}` : ""}.
        </span>
      </label>

      {error ? (
        <p className="contact-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {submitted ? (
        <p className="contact-form__success" role="status">
          {ui.submitted}
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusLabel}
      </p>

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className={[
          "contact-form__submit",
          submitted ? "is-success" : "",
          loading ? "is-loading" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {statusLabel}
      </Button>
    </form>
  );
}
