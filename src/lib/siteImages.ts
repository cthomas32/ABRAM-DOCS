import { supabase } from "@/utils/supabase/static";

/**
 * The photographs, on the site.
 *
 * ON THE SHELF. Nothing on the site reads this today: the sections it fed
 * were placed once and taken back off. See `.agents/site-visuals.md`.
 *
 * The same shelf the Social Studio draws cards on. They are ours, they are
 * of real work, and behind a section of copy they carry further than any
 * gradient we could paint: a page of flat panels reads as software, and a
 * photograph reads as the job the software is for.
 *
 * Nothing here is curated. Every picture in the library is in the pool, so
 * an upload on a Tuesday can be behind a section that afternoon with no
 * deploy, and the choice per slot is a hash of the slot's name rather than
 * a random number. That matters more than it looks: a random pick would
 * hand the server and the browser different pictures, and would change the
 * page under a visitor on every navigation.
 */

export interface SitePhoto {
  id: string;
  label: string;
  url: string;
  /** What shows while the file loads, and if it ever goes missing. */
  baseColor: string;
  width: number | null;
  height: number | null;
  /** Who took it, where the library records them. */
  credit: string | null;
  creditHandle: string | null;
  /** Taller than it is wide, which decides where it can sit. */
  portrait: boolean;
}

interface LibraryRow {
  id: string;
  label: string;
  public_url: string;
  base_color: string | null;
  width: number | null;
  height: number | null;
  credit: string | null;
  credit_handle: string | null;
}

/**
 * Read the library.
 *
 * Ordered oldest first rather than newest: the slot a picture lands in is
 * its position in this list, and ordering by upload date would move every
 * picture on the site one seat along every time somebody adds one.
 *
 * A failure returns an empty pool, and every component that takes a photo
 * is built to render without one. The library going quiet should cost the
 * page its decoration, never its copy.
 */
export async function getSitePhotos(): Promise<SitePhoto[]> {
  try {
    const { data, error } = await supabase
      .from("social_backdrop_images")
      .select("id, label, public_url, base_color, width, height, credit, credit_handle")
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return (data as LibraryRow[])
      .filter((row) => Boolean(row.public_url))
      .map((row) => ({
        id: row.id,
        label: row.label,
        url: row.public_url,
        baseColor: row.base_color || "#0A0A0A",
        width: row.width,
        height: row.height,
        credit: row.credit,
        creditHandle: row.credit_handle,
        portrait: Boolean(row.width && row.height && row.height > row.width),
      }));
  } catch {
    return [];
  }
}

/** FNV-1a. Small, stable, and the same on the server and in the browser. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/**
 * One picture per named slot, and never the same picture twice on a page.
 *
 * The name is the seed, so `homepage-brain` keeps its photograph across
 * renders and deploys, and a new upload only changes which slot it lands
 * in when the size of the pool changes. Walking forward from the hashed
 * index is what stops two sections of the same page colliding.
 */
export function pickPhotos(pool: SitePhoto[], slots: string[]): Record<string, SitePhoto | null> {
  const chosen: Record<string, SitePhoto | null> = {};
  const used = new Set<string>();

  for (const slot of slots) {
    if (pool.length === 0) {
      chosen[slot] = null;
      continue;
    }

    const start = hash(slot) % pool.length;
    let pick = pool[start];
    for (let step = 0; step < pool.length; step += 1) {
      const candidate = pool[(start + step) % pool.length];
      if (!used.has(candidate.id)) {
        pick = candidate;
        break;
      }
    }

    used.add(pick.id);
    chosen[slot] = pick;
  }

  return chosen;
}

/** The same, for one slot. */
export function pickPhoto(pool: SitePhoto[], slot: string): SitePhoto | null {
  return pickPhotos(pool, [slot])[slot];
}

/**
 * Prefer a picture the right way up for the space.
 *
 * A portrait photograph in a wide band is a crop of somebody's middle. The
 * pool is filtered first and the pick runs against what is left, so the
 * seeding still holds inside that smaller set.
 */
export function pickOriented(
  pool: SitePhoto[],
  slots: string[],
  orientation: "landscape" | "portrait"
): Record<string, SitePhoto | null> {
  const wanted = pool.filter((photo) => (orientation === "portrait" ? photo.portrait : !photo.portrait));
  return pickPhotos(wanted.length > 0 ? wanted : pool, slots);
}

/** Who took it, as one line. The handle is stored bare, so the @ goes on here. */
export function creditLine(photo: SitePhoto): string | null {
  const who = (photo.credit || "").trim();
  const handle = (photo.creditHandle || "").trim().replace(/^@+/, "");
  if (who && handle) return `${who} @${handle}`;
  if (handle) return `@${handle}`;
  return who || null;
}
