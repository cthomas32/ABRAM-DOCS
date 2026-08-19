"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { thumbnailUrl, type DemoVideo } from "@/lib/demos";

/**
 * Mux Player is roughly 100KB over the wire and nothing on this page needs
 * it until somebody presses play, so it loads on selection rather than on
 * navigation. `ssr: false` because the underlying element is a custom
 * element and there is no server render worth having for it.
 */
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => null,
});

/**
 * Player chrome, trimmed.
 *
 * Mux Player exposes every control as a CSS custom property, and setting one
 * to `none` removes it. What is left is play, scrub, time, volume and
 * fullscreen. Everything taken away is either a duplicate of a gesture the
 * scrub bar already has (the 10 second skips), a menu nobody opens on a four
 * minute walkthrough (playback rate, quality), or a device handoff that only
 * appears on some hardware and so makes the control bar a different width
 * depending on who is looking at it (cast, AirPlay, picture-in-picture).
 *
 * The accent is white rather than the brand red. On a dark player the red
 * reads as a warning state, and the progress bar is the one element the eye
 * tracks for the whole runtime.
 */
/* Mux types the style prop as CSSProperties plus an index signature for
   custom properties, so the literal is annotated rather than cast. */
type PlayerStyle = CSSProperties & Record<`--${string}`, string>;

const playerStyle: PlayerStyle = {
  "--cast-button": "none",
  "--airplay-button": "none",
  "--pip-button": "none",
  "--playback-rate-button": "none",
  "--rendition-menu-button": "none",
  "--seek-backward-button": "none",
  "--seek-forward-button": "none",
  "--controls-backdrop-color": "rgba(10, 10, 10, 0.35)",
  "--media-object-fit": "contain",
  aspectRatio: "16 / 9",
  width: "100%",
  height: "100%",
  display: "block",
  backgroundColor: "#0A0A0A",
  overflow: "hidden",
};

export default function DemoPlayer({
  video,
  autoPlay = true,
}: {
  video: DemoVideo;
  autoPlay?: boolean;
}) {
  return (
    <MuxPlayer
      playbackId={video.playbackId ?? undefined}
      streamType="on-demand"
      /* The card the player grew out of was showing this exact frame, so the
         first painted frame of the player matches it and the expansion does
         not flash black before the manifest arrives. */
      poster={thumbnailUrl(video, { width: 1920, height: 1080 })}
      accentColor="#FAFAF9"
      primaryColor="#FAFAF9"
      secondaryColor="rgba(10, 10, 10, 0.6)"
      /* "any" lets the browser fall back to muted autoplay rather than
         refusing outright. The click that opened the player usually counts
         as the gesture, so in practice it starts with sound. */
      autoPlay={autoPlay ? "any" : false}
      playsInline
      metadata={{
        video_id: video.slug,
        video_title: video.title,
      }}
      style={playerStyle}
    />
  );
}
