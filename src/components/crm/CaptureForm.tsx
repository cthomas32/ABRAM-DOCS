"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, CloudOff } from "lucide-react";
import { ease } from "@/lib/motion";
import { FIELD_LIMITS } from "@/lib/crm/constants";
import type { CapturePayload } from "@/lib/crm/types";
import {
  CAPTURE_ENDPOINT,
  flush,
  newClientToken,
  pending,
  startAutoFlush,
  submitCapture,
} from "@/lib/crm/offlineQueue";

/**
 * The "send me yours" form.
 *
 * Two things matter here and nothing else does. It has to be finishable by
 * a stranger in a hallway in a few seconds, which is why only the name is
 * required and the rest is folded away. And it must never lose what they
 * typed, which is why the submission goes into a durable queue before it
 * goes anywhere near the network, and why a failed send is reported as
 * saved rather than as an error.
 *
 * The console renders this same component to draw its preview, in `preview`
 * mode, which is why it lives beside the card surface rather than under the
 * public route. A preview is the real markup with the machinery taken out:
 * no outbox, no scan beacon, no service worker and a submit that goes
 * nowhere. A copy of this form kept only for the console drifted from the
 * real one within a day, so there is deliberately only one.
 */

type Status = "idle" | "sending" | "sent" | "queued" | "error";

interface CaptureFormProps {
  slug: string;
  code: string | null;
  ownerName: string;
  /**
   * Draw it, run nothing. Every side effect is skipped and submitting does
   * nothing at all, so a preview can never write a contact or send an email.
   */
  preview?: boolean;
}

/** The payload plus the scan this came from, which the shared type predates. */
type CardCapturePayload = CapturePayload & { scan_id?: string | null };

/* text-base is load bearing. Anything smaller and iOS Safari zooms the page
   on focus, which on a card handed to a stranger reads as the page breaking. */
const FIELD_CLASS =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-base text-white " +
  "placeholder:text-zinc-600 outline-none transition duration-200 " +
  "focus:border-white/25 focus:bg-white/[0.05] focus:ring-4 focus:ring-white/[0.04]";

const LABEL_CLASS = "block text-[11px] font-medium tracking-wide text-zinc-500";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/**
 * Asks the browser to wake the worker when the network returns. Feature
 * detected on purpose: iOS Safari has no Background Sync, and there the
 * queue's own timer and online listener are what actually get the details
 * out.
 */
async function requestBackgroundSync(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    if (!registration.sync) return;
    await registration.sync.register("abram-crm-flush");
  } catch {
    /* No sync support, or a denied permission. The timer covers it. */
  }
}

function trimTo(value: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export default function CaptureForm({
  slug,
  code,
  ownerName,
  preview = false,
}: CaptureFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [message, setMessage] = useState("");
  const [companyUrl, setCompanyUrl] = useState(""); // Honeypot.
  const [consent, setConsent] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState<string | null>(null);

  const scanIdRef = useRef<string | null>(null);
  const beaconSent = useRef(false);
  const reduce = useReducedMotion();

  /* The queue's retry triggers live for as long as this form is on screen.
     A preview has nothing to retry, so it never starts them. */
  useEffect(() => {
    if (preview) return;
    return startAutoFlush();
  }, [preview]);

  /* A service worker that has anything left to send can ask for a flush. */
  useEffect(() => {
    if (preview) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "abram-crm-flush") void flush();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    navigator.serviceWorker.register("/crm-sw.js", { scope: "/c/" }).catch(() => {
      /* A card that cannot install a worker still works. */
    });

    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [preview]);

  /* Fire and forget scan telemetry. Its id lets a capture be tied to the scan.
     A preview is not a scan and must never be counted as one. */
  useEffect(() => {
    if (preview) return;
    if (beaconSent.current) return;
    beaconSent.current = true;

    const send = async () => {
      try {
        const response = await fetch("/api/crm/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            code,
            referrer: typeof document !== "undefined" ? document.referrer || null : null,
          }),
          keepalive: true,
        });
        const data = (await response.json()) as { scan_id?: string | null };
        if (data && typeof data.scan_id === "string") scanIdRef.current = data.scan_id;
      } catch {
        /* Telemetry never gets in the way of the card. */
      }
    };

    void send();
  }, [slug, code, preview]);

  const askForRetry = () => {
    setStatus("error");
    setProblem("That did not go through. Have another go.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    /* The one line that guarantees a preview cannot reach the database.
       It sits above every branch below on purpose. */
    if (preview) return;
    if (status === "sending") return;

    const name = trimTo(fullName, FIELD_LIMITS.full_name);
    if (!name) {
      setProblem("A name is all we need to start.");
      return;
    }

    const cleanEmail = trimTo(email, FIELD_LIMITS.email);
    if (!cleanEmail) {
      setProblem("An email address too, so I have a way to reach you.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setProblem("That email address looks incomplete.");
      return;
    }

    setProblem(null);
    setStatus("sending");

    const token = newClientToken();
    const payload: CardCapturePayload = {
      client_token: token,
      profile_slug: slug,
      code: code || null,
      full_name: name,
      email: cleanEmail,
      phone: trimTo(phone, FIELD_LIMITS.phone),
      company: trimTo(company, FIELD_LIMITS.company),
      job_title: trimTo(jobTitle, FIELD_LIMITS.job_title),
      notes: trimTo(message, FIELD_LIMITS.notes),
      consent_marketing: consent,
      source: "qr_card",
      captured_at: new Date().toISOString(),
      scan_id: scanIdRef.current,
    };
    if (companyUrl.trim()) payload.company_url = companyUrl.trim();

    try {
      const { delivered } = await submitCapture(payload);

      if (delivered) {
        setStatus("sent");
        return;
      }

      /* Still in the queue means it is safe and will go out later. Gone from
         the queue means the server refused it outright, so say so. */
      const waiting = await pending();
      if (waiting.some((item) => item.id === token)) {
        setStatus("queued");
        void requestBackgroundSync();
      } else {
        askForRetry();
      }
    } catch {
      /* A blocked storage engine takes the queue out of play, so try the
         network directly rather than dropping what they typed. */
      try {
        const response = await fetch(CAPTURE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        if (response.ok) setStatus("sent");
        else askForRetry();
      } catch {
        askForRetry();
      }
    }
  };

  if (status === "sent" || status === "queued") {
    const who = firstName(ownerName);
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: ease.cinematic }}
        className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 text-center"
        aria-live="polite"
      >
        {/* One beat: the disc springs in, then the tick draws itself. It runs
            once, on a tap, well after first paint, so it costs a stranger
            nothing on arrival. */}
        <motion.div
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 320, damping: 18, mass: 0.7 }
          }
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            status === "sent" ? "bg-emerald-500" : "bg-white"
          }`}
        >
          {status === "sent" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A0A0A"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : { delay: 0.14, duration: 0.42, ease: ease.cinematic }}
              />
            </svg>
          ) : (
            <CloudOff className="h-6 w-6 text-[#0A0A0A]" />
          )}
        </motion.div>
        <p className="mt-4 text-base font-semibold tracking-tight text-white">
          {status === "sent" ? `Sent. ${who} has your details.` : "Saved on your phone."}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
          {status === "sent"
            ? "Good to meet you."
            : "The wifi in here is busy. Leave this page open and it sends itself the moment you have signal."}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
      <div>
        <label htmlFor="capture-name" className={LABEL_CLASS}>
          Your name
        </label>
        <input
          id="capture-name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={FIELD_LIMITS.full_name}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Alex Moreau"
          className={`mt-1.5 ${FIELD_CLASS}`}
        />
      </div>

      <div>
        <label htmlFor="capture-email" className={LABEL_CLASS}>
          Email
        </label>
        <input
          id="capture-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          maxLength={FIELD_LIMITS.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@studio.com"
          className={`mt-1.5 ${FIELD_CLASS}`}
        />
      </div>

      <div>
        <label htmlFor="capture-company" className={LABEL_CLASS}>
          Company <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          id="capture-company"
          name="company"
          type="text"
          autoComplete="organization"
          enterKeyHint="done"
          maxLength={FIELD_LIMITS.company}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Vesper Studios"
          className={`mt-1.5 ${FIELD_CLASS}`}
        />
      </div>

      {/* Honeypot. A person never sees this and never tabs into it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="capture-company-url">Company website</label>
        <input
          id="capture-company-url"
          name="company_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((open) => !open)}
        aria-expanded={showMore}
        className="flex min-h-11 w-full items-center justify-between text-xs font-medium tracking-wide text-zinc-500 transition-colors duration-200 hover:text-zinc-300"
      >
        <span>{showMore ? "Less" : "Add more"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${showMore ? "rotate-180" : ""}`}
        />
      </button>

      {/* Rendered only when open, so the extra fields never sit in the tab
          order of somebody who is filling in three boxes and handing the
          phone straight back. */}
      <AnimatePresence initial={false}>
        {showMore ? (
          <motion.div
            key="more"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.cinematic }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-1">
        <div>
          <label htmlFor="capture-phone" className={LABEL_CLASS}>
            Phone
          </label>
          <input
            id="capture-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={FIELD_LIMITS.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900123"
            className={`mt-1.5 ${FIELD_CLASS}`}
          />
        </div>

        <div>
          <label htmlFor="capture-role" className={LABEL_CLASS}>
            Job title
          </label>
          <input
            id="capture-role"
            name="job_title"
            type="text"
            autoComplete="organization-title"
            maxLength={FIELD_LIMITS.job_title}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Head of Production"
            className={`mt-1.5 ${FIELD_CLASS}`}
          />
        </div>

        <div>
          <label htmlFor="capture-message" className={LABEL_CLASS}>
            Anything you want to add
          </label>
          <textarea
            id="capture-message"
            name="notes"
            rows={3}
            maxLength={FIELD_LIMITS.notes}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What we talked about, or what to send you."
            className={`mt-1.5 ${FIELD_CLASS} resize-y`}
          />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* The native control is still the control: it keeps the keyboard, the
          screen reader and the form semantics. Only its appearance is
          replaced, drawn from the input's own checked state through `peer`
          so the two can never disagree. */}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
        <input
          type="checkbox"
          name="consent_marketing"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="peer sr-only"
        />
        <motion.span
          aria-hidden="true"
          animate={reduce ? undefined : { scale: consent ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.28, ease: ease.cinematic }}
          className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border border-white/20 bg-white/[0.03] transition-colors duration-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0A0A0A]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={false}
              animate={{ pathLength: consent ? 1 : 0, opacity: consent ? 1 : 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { pathLength: { duration: 0.3, ease: ease.cinematic }, opacity: { duration: 0.12 } }
              }
            />
          </svg>
        </motion.span>
        <span className="text-xs leading-relaxed text-zinc-500">
          You can email me about ABRAM. Your details reach {firstName(ownerName)} either way.
        </span>
      </label>

      <AnimatePresence>
        {problem ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: ease.snap }}
            className="text-xs text-red-400"
            role="alert"
          >
            {problem}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={status === "sending"}
        whileTap={reduce || status === "sending" ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.15, ease: ease.snap }}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] text-[15px] font-semibold text-white transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 disabled:cursor-default disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white"
            />
            Sending
          </>
        ) : (
          "Send my details"
        )}
      </motion.button>
    </form>
  );
}
