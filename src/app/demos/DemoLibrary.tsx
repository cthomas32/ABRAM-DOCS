"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import DemoPlayer from "@/components/demos/DemoPlayer";
import {
  formatDuration,
  previewUrl,
  thumbnailUrl,
  type DemoFolder,
  type DemoVideo,
} from "@/lib/demos";

/* One easing curve and one duration for the whole page. Two would read as
   two different products. */
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.45;

/**
 * Mux has already resized these and already served them as webp from its
 * own CDN, so running them through the Next image optimizer would pay for
 * the same job twice and put a cold origin fetch in front of a warm edge
 * cache. Plain <img> on purpose.
 */
/* eslint-disable @next/next/no-img-element */

function Thumbnail({ video, hovered }: { video: DemoVideo; hovered: boolean }) {
  const duration = formatDuration(video.duration);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/8">
      <img
        src={thumbnailUrl(video)}
        alt=""
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* The animated loop is only requested once the cursor is actually
          on the card. Before that it costs nothing. */}
      {hovered && (
        <motion.img
          src={previewUrl(video)}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md transition-all duration-300 ${
            hovered ? "scale-105 border-white/25 bg-black/55" : "scale-100"
          }`}
        >
          <Play className="h-4 w-4 translate-x-px fill-white text-white" strokeWidth={0} />
        </div>
      </div>

      {duration && (
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-300 backdrop-blur-sm">
          {duration}
        </span>
      )}
    </div>
  );
}

function DemoCard({
  video,
  onSelect,
  index,
}: {
  video: DemoVideo;
  onSelect: (slug: string) => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(video.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: EASE, delay: reduceMotion ? 0 : index * 0.05 }}
      className="group w-full cursor-pointer text-left outline-none"
      aria-label={`Play ${video.title}`}
    >
      <motion.div layoutId={`frame-${video.slug}`} className="rounded-xl">
        <Thumbnail video={video} hovered={hovered && !reduceMotion} />
      </motion.div>

      <div className="mt-3.5 px-0.5">
        <h3 className="text-sm font-medium tracking-tight text-white">{video.title}</h3>
        {video.description && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{video.description}</p>
        )}
      </div>
    </motion.button>
  );
}

function UpNext({
  videos,
  onSelect,
}: {
  videos: DemoVideo[];
  onSelect: (slug: string) => void;
}) {
  if (videos.length === 0) return null;

  return (
    <div className="mt-14 border-t border-white/5 pt-8">
      <span className="mb-5 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        More demos
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <button
            key={video.slug}
            type="button"
            onClick={() => onSelect(video.slug)}
            className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-white/[0.03]"
          >
            <img
              src={thumbnailUrl(video, { width: 320, height: 180 })}
              alt=""
              width={320}
              height={180}
              loading="lazy"
              decoding="async"
              className="h-11 w-20 shrink-0 rounded-md object-cover ring-1 ring-white/8"
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-zinc-300 transition-colors duration-200 group-hover:text-white">
                {video.title}
              </span>
              {formatDuration(video.duration) && (
                <span className="mt-0.5 block text-[10px] tracking-wide text-zinc-600">
                  {formatDuration(video.duration)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The folder rail.
 *
 * Folders read as folders here rather than as a stack of headed sections:
 * one label per folder, plus All, and picking one filters the grid. The
 * labels wrap rather than scroll, because a row that scrolls sideways on a
 * phone hides the folders past the edge and there is nothing to tell you
 * they are there.
 */
function FolderRail({
  folders,
  active,
  onSelect,
  query,
  onQuery,
}: {
  folders: DemoFolder[];
  active: string | null;
  onSelect: (slug: string | null) => void;
  query: string;
  onQuery: (value: string) => void;
}) {
  const chip = (selected: boolean) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
      selected
        ? "border-white bg-white text-black"
        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
    }`;

  return (
    <div className="mb-9 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSelect(null)} className={chip(active === null)}>
          All
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => onSelect(folder.slug)}
            className={chip(active === folder.slug)}
          >
            {folder.name}
          </button>
        ))}
      </div>

      <label className="sm:w-56 sm:shrink-0">
        <span className="sr-only">Search demos</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search demos"
          className="h-8 w-full rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
        />
      </label>
    </div>
  );
}

/** "FOR FILM PROGRAMS · 5" over a group in the All view. */
function GroupLabel({ folder }: { folder: DemoFolder }) {
  return (
    <div className="mb-4 flex items-baseline gap-2">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {folder.name}
      </span>
      <span className="font-sans text-[10px] font-medium tracking-wide text-zinc-600">
        · {folder.videos.length}
      </span>
    </div>
  );
}

export default function DemoLibrary({ folders }: { folders: DemoFolder[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [folderSlug, setFolderSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const all = useMemo(() => folders.flatMap((folder) => folder.videos), [folders]);
  const active = all.find((video) => video.slug === activeSlug) ?? null;

  /* One folder is not a set of folders, so the rail only appears once
     there is something to choose between. */
  const showRail = folders.length > 1;

  /* Search runs across whatever the rail has left, so a word typed inside
     a folder searches that folder and the same word under All searches
     everything. */
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (video: DemoVideo) =>
      needle.length === 0 ||
      video.title.toLowerCase().includes(needle) ||
      (video.description ?? "").toLowerCase().includes(needle);

    return folders
      .filter((folder) => !folderSlug || folder.slug === folderSlug)
      .map((folder) => ({ ...folder, videos: folder.videos.filter(matches) }))
      .filter((folder) => folder.videos.length > 0);
  }, [folders, folderSlug, query]);

  /** The folder the rail is on, when it is on one. */
  const selected = folderSlug
    ? (folders.find((folder) => folder.slug === folderSlug) ?? null)
    : null;

  /* The entrance stagger counts down the page rather than restarting in
     each group, so the second folder does not replay the first one's. */
  const order = useMemo(() => shown.flatMap((folder) => folder.videos.map((v) => v.id)), [shown]);

  /* ?v=<slug> is the shareable address of a single demo. Read from
     location rather than useSearchParams so this component does not have
     to sit inside a Suspense boundary for one string. */
  const syncUrl = useCallback((slug: string | null, push: boolean) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("v", slug);
    else url.searchParams.delete("v");
    const next = `${url.pathname}${url.search}`;
    if (push) window.history.pushState({ v: slug }, "", next);
    else window.history.replaceState({ v: slug }, "", next);
  }, []);

  /* ?f=<folder-slug> is the shareable address of one folder. Replaced
     rather than pushed: picking a label is filtering a page, not going to
     a new one, so it should not need three back presses to undo. */
  const selectFolder = useCallback((slug: string | null) => {
    setFolderSlug(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("f", slug);
    else url.searchParams.delete("f");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }, []);

  useEffect(() => {
    const known = (slug: string | null) => Boolean(slug && all.some((v) => v.slug === slug));
    const knownFolder = (slug: string | null) =>
      slug && folders.some((folder) => folder.slug === slug) ? slug : null;

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("v");
    if (known(fromUrl)) setActiveSlug(fromUrl);

    /* An unknown or emptied folder is All rather than an error. A link
       to a folder that has since been renamed still shows the library. */
    setFolderSlug(knownFolder(params.get("f")));

    /* Back out of a demo with the browser's back button, not just ours. */
    const onPop = () => {
      const current = new URLSearchParams(window.location.search);
      const slug = current.get("v");
      setActiveSlug(known(slug) ? slug : null);
      setFolderSlug(knownFolder(current.get("f")));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [all, folders]);

  const select = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      syncUrl(slug, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [syncUrl],
  );

  const close = useCallback(() => {
    setActiveSlug(null);
    syncUrl(null, true);
  }, [syncUrl]);

  useEffect(() => {
    if (!activeSlug) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlug, close]);

  if (all.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.015] px-6 py-16 text-center">
        <p className="text-sm text-zinc-400">Demos are being recorded.</p>
        <p className="mt-1.5 text-xs text-zinc-600">Check back shortly.</p>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
        {active ? (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            <button type="button" onClick={close} className="btn-ghost -ml-3 mb-6 cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" />
              All demos
            </button>

            {/* The frame is 16:9, so on a laptop a full width player is
                650px tall and the title lands below the fold. Capping the
                width by what is left of the viewport height keeps video,
                title and sentence on one screen without letterboxing.
                The ratio is a decimal because Tailwind reads a `/` inside
                an arbitrary value as an opacity modifier and drops the
                whole class. */}
            <motion.div
              layoutId={`frame-${active.slug}`}
              className="mx-auto w-full max-w-[calc((100dvh-20rem)*1.7778)] overflow-hidden rounded-xl bg-black ring-1 ring-white/10"
            >
              <DemoPlayer video={active} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION, ease: EASE, delay: 0.15 }}
              className="mt-6 max-w-2xl"
            >
              <h1 className="text-xl font-semibold tracking-tight text-white">{active.title}</h1>
              {active.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{active.description}</p>
              )}
            </motion.div>

            <UpNext videos={all.filter((video) => video.slug !== active.slug)} onSelect={select} />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            {showRail && (
              <FolderRail
                folders={folders}
                active={folderSlug}
                onSelect={selectFolder}
                query={query}
                onQuery={setQuery}
              />
            )}

            {selected?.description && (
              <p className="mb-8 max-w-2xl text-xs leading-relaxed text-zinc-500">
                {selected.description}
              </p>
            )}

            {shown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-14 text-center">
                <p className="text-sm text-zinc-400">Nothing here matches that.</p>
                <p className="mt-1.5 text-xs text-zinc-600">
                  Try another word, or pick All to search every folder.
                </p>
              </div>
            ) : (
              <div className="space-y-14">
                {shown.map((folder) => (
                  <section key={folder.id}>
                    {/* Under All the folder is named over its group; inside
                        one folder the rail is already saying which. */}
                    {folderSlug === null && showRail && <GroupLabel folder={folder} />}

                    <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                      {folder.videos.map((video) => (
                        <DemoCard
                          key={video.id}
                          video={video}
                          onSelect={select}
                          /* Capped, because a library this long would
                             otherwise take a second to finish arriving. */
                          index={Math.min(order.indexOf(video.id), 8)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
