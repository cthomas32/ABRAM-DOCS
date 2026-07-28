"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CampaignSlug } from "@/lib/campaigns";

export type CampaignEvent =
  | "scroll"
  | "cta_click"
  | "signup_click"
  | "email_capture"
  | "faq_open"
  | "section_view";

export interface CampaignAttribution {
  source: string | null;
  medium: string | null;
  campaign: string | null;
}

const ENDPOINT = "/api/track/landing";
const SCROLL_MILESTONES = [25, 50, 75, 90, 100] as const;

/**
 * A single page load can mount the tracker more than once (development
 * double-invocation, fast refresh, a remount during hydration). These
 * module-level registries keep one session identifier per page load so a
 * visit is never counted twice, while a genuine later revisit still opens
 * a fresh session.
 */
const SESSION_WINDOW_MS = 10_000;
const sessionRegistry = new Map<string, { id: string; at: number }>();
const viewsSent = new Set<string>();
const milestonesSent = new Map<string, Set<number>>();

function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function acquireSessionId(pageSlug: string): string {
  const existing = sessionRegistry.get(pageSlug);
  if (existing && Date.now() - existing.at < SESSION_WINDOW_MS) {
    return existing.id;
  }

  const id = newSessionId();
  sessionRegistry.set(pageSlug, { id, at: Date.now() });
  return id;
}

/** Read an attribution value, accepting both the utm_ and the short form. */
function readParam(params: URLSearchParams, utm: string, short: string): string | null {
  return params.get(utm) || params.get(short);
}

/**
 * Records the funnel for a campaign landing page.
 *
 * The session identifier lives in memory for the life of the page view.
 * Nothing is written to cookies, localStorage or sessionStorage, so the
 * page carries no device storage that would require a consent gate.
 */
export function useCampaignTracking(pageSlug: CampaignSlug) {
  const [sessionId] = useState(() => acquireSessionId(pageSlug));
  const [attribution, setAttribution] = useState<CampaignAttribution>({
    source: null,
    medium: null,
    campaign: null,
  });

  const startedAt = useRef(Date.now());
  const maxScroll = useRef(0);

  /** Fire-and-forget event send. Never blocks or surfaces errors to the visitor. */
  const send = useCallback(
    (eventType: string, label?: string | null, value?: number | null, beacon = false) => {
      const payload = JSON.stringify({ sessionId, pageSlug, eventType, label, value });

      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
          return;
        } catch {
          /* fall through to fetch */
        }
      }

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* telemetry is best effort */
      });
    },
    [sessionId, pageSlug]
  );

  /** Public tracker used by CTAs, accordions and the email form. */
  const track = useCallback(
    (eventType: CampaignEvent, label?: string, value?: number) => {
      send(eventType, label ?? null, value ?? null);
    },
    [send]
  );

  // Opening view: capture attribution from the URL and the referrer.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = readParam(params, "utm_source", "src");
    const medium = readParam(params, "utm_medium", "med");
    const campaign = readParam(params, "utm_campaign", "cmp");

    setAttribution({ source, medium, campaign });

    // Attribution still needs to reach the UI on a remount, but the visit
    // itself is only ever recorded once per session.
    if (viewsSent.has(sessionId)) return;
    viewsSent.add(sessionId);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        pageSlug,
        eventType: "view",
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        source,
        medium,
        campaign,
        content: readParam(params, "utm_content", "ct"),
        term: readParam(params, "utm_term", "tm"),
      }),
    }).catch(() => {
      /* telemetry is best effort */
    });
  }, [sessionId, pageSlug]);

  // Scroll depth milestones.
  useEffect(() => {
    let ticking = false;

    let reached = milestonesSent.get(sessionId);
    if (!reached) {
      reached = new Set<number>();
      milestonesSent.set(sessionId, reached);
    }
    const sentMilestones = reached;

    const measure = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable <= 0 ? 100 : Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100);
      const clamped = Math.max(0, Math.min(100, pct));

      if (clamped > maxScroll.current) maxScroll.current = clamped;

      for (const milestone of SCROLL_MILESTONES) {
        if (clamped >= milestone && !sentMilestones.has(milestone)) {
          sentMilestones.add(milestone);
          send("scroll", `${milestone}%`, milestone);
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    measure();

    return () => window.removeEventListener("scroll", onScroll);
  }, [send, sessionId]);

  // Time on page, flushed when the tab goes away.
  useEffect(() => {
    const flush = () => {
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      if (seconds < 2) return;
      send("exit", null, seconds, true);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [send]);

  return { track, attribution };
}
