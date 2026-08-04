/**
 * Getting a finished card off the screen and into the place it is wanted.
 *
 * On a desktop that is a file in the downloads folder, which a plain anchor
 * with a download attribute has always handled. A phone is a different
 * problem. A PNG downloaded in mobile Safari lands in Files, and there is no
 * route from there to the camera roll short of opening the Files app and
 * sharing it back out. The system share sheet is the only thing that can
 * write to Photos, and it offers Files in the same list, so on a touch
 * device the render goes to the sheet and the person picks: Save Image for
 * Photos, Save to Files for Files.
 *
 * Every caller goes through {@link saveCards}, so a carousel arrives as one
 * sheet with all its slides rather than one sheet per slide.
 */

import { useEffect, useState } from "react";

export type SaveTarget = {
  /** Where the PNG comes from: a render route or a stored public address. */
  url: string;
  filename: string;
};

export type SaveOutcome = "shared" | "downloaded" | "cancelled";

/** A phone or a tablet, as far as anything here needs to care. */
function isTouchDevice(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Whether this device can hand images to a system sheet. Desktops are
 * excluded even when they can share: a download folder is what is expected
 * there, and a sheet in the middle of the screen is an interruption.
 */
export function canShareImages(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  if (!isTouchDevice()) return false;
  try {
    const probe = new File([new Blob([], { type: "image/png" })], "card.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * The same answer, for wording a button. False on the first render so the
 * server and the client agree, then true on a phone once mounted.
 */
export function useCanShareImages(): boolean {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(canShareImages()), []);
  return canShare;
}

/**
 * All at once rather than one after another. A carousel of ten slides is
 * ten renders, and on a phone the wait is also the window in which the tap
 * still counts as the gesture that opened the sheet.
 */
async function fetchFiles(targets: SaveTarget[]): Promise<File[]> {
  return Promise.all(
    targets.map(async (target) => {
      const response = await fetch(target.url);
      if (!response.ok) throw new Error("That card did not come back. Try again.");
      const blob = await response.blob();
      return new File([blob], target.filename, { type: blob.type || "image/png" });
    })
  );
}

function downloadFiles(files: File[]) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Released on the next turn rather than immediately: Safari reads the
    // blob after the click returns, and revoking underneath it saves nothing.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/**
 * Fetch the cards and deliver them. Returns what actually happened, so a
 * caller can stay quiet when someone simply closed the sheet.
 *
 * Fetching before sharing costs the gesture on some versions of Safari,
 * which answers `navigator.share` with a NotAllowedError. That is not worth
 * a dead end, so the download path catches it.
 */
export async function saveCards(targets: SaveTarget[], shareTitle?: string): Promise<SaveOutcome> {
  const files = await fetchFiles(targets);

  if (canShareImages() && navigator.canShare({ files })) {
    try {
      await navigator.share({ files, title: shareTitle || files[0]?.name });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // Anything else: fall through and put the file somewhere.
    }
  }

  downloadFiles(files);
  return "downloaded";
}
