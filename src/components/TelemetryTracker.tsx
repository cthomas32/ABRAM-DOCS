"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface TelemetryTrackerProps {
  id: string;
  type: "blog_post" | "release_note";
}

export default function TelemetryTracker({ id, type }: TelemetryTrackerProps) {
  const hasFiredView = useRef(false);
  const hasFiredRead = useRef(false);

  useEffect(() => {
    // Reset refs on id/type change in case the component instance is reused
    hasFiredView.current = false;
    hasFiredRead.current = false;

    const supabase = createClient();

    // 1. Track View on mount
    const trackView = async () => {
      if (hasFiredView.current) return;
      hasFiredView.current = true;
      try {
        const { error } = await supabase.rpc("track_content_event", {
          p_content_type: type,
          p_id: id,
          p_event_type: "view",
        });
        if (error) {
          console.error("Telemetry: Failed to track view:", error);
        }
      } catch (err) {
        console.error("Telemetry: Error calling track_content_event for view:", err);
      }
    };

    trackView();

    // 2. Track Read (either 15-second timer or 50% scroll depth, whichever occurs first)
    let timerId: NodeJS.Timeout | null = null;

    const trackRead = async () => {
      if (hasFiredRead.current) return;
      hasFiredRead.current = true;

      // Clean up event listeners and timers immediately to prevent multiple triggers
      cleanup();

      try {
        const { error } = await supabase.rpc("track_content_event", {
          p_content_type: type,
          p_id: id,
          p_event_type: "read",
        });
        if (error) {
          console.error("Telemetry: Failed to track read:", error);
        }
      } catch (err) {
        console.error("Telemetry: Error calling track_content_event for read:", err);
      }
    };

    // 15-second timer
    timerId = setTimeout(() => {
      trackRead();
    }, 15000);

    // Scroll depth listener
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      if (scrollHeight === 0) return;
      const scrollPercent = (scrollTop + windowHeight) / scrollHeight;

      if (scrollPercent >= 0.5) {
        trackRead();
      }
    };

    // Attach scroll listener with passive flag for performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check immediately in case page is already scrolled or content fits in viewport
    handleScroll();

    const cleanup = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      window.removeEventListener("scroll", handleScroll);
    };

    return cleanup;
  }, [id, type]);

  return null;
}
