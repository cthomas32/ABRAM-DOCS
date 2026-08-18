"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Contact, CornerDownLeft, Handshake, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { rows } from "@/lib/supabase/rows";
import type { Permission } from "@/lib/auth/permissions";
import { visibleGroups, type AdminNavLink } from "@/app/admin/dashboard/nav";

/**
 * ⌘K.
 *
 * The honest answer to "there are a TON of pages now". A sidebar of six
 * groups is a better map, but a map still has to be read; typing three
 * letters of a company name and pressing return does not.
 *
 * Three things are searchable and no more: the destinations this person
 * may enter, and the two records they look up by name all day — people
 * and companies — plus deals, which is where the two meet. Nothing here
 * writes, so there is no confirm step and no undo to design.
 *
 * Records are fetched once, on the first open, and then filtered in
 * memory. A growth team of three has hundreds of contacts, not hundreds
 * of thousands, and a query per keystroke would be slower than the list
 * it is searching. Row level security decides what comes back, so the
 * palette cannot surface a row its owner could not already open.
 */

/**
 * The shortcut is the primary way in, but a keyboard shortcut nobody has
 * been told about is not an affordance. The sidebar draws a button, and
 * the button raises this rather than faking a key press.
 */
const PALETTE_EVENT = "abram:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}

type Kind = "page" | "contact" | "account" | "deal";

interface Entry {
  id: string;
  kind: Kind;
  label: string;
  hint: string;
  href: string;
  /** Lowercased haystack, built once. */
  haystack: string;
  icon: React.ComponentType<{ className?: string }>;
}

const KIND_LABEL: Record<Kind, string> = {
  page: "Go to",
  contact: "People",
  account: "Companies",
  deal: "Deals",
};

const ORDER: Kind[] = ["page", "contact", "account", "deal"];

/** Pages first, then whichever records match best. Ten is a screenful. */
const LIMIT = 12;

function pageEntry(link: AdminNavLink): Entry {
  return {
    id: `page:${link.id}`,
    kind: "page",
    label: link.label,
    hint: link.hint,
    href: link.href,
    haystack: [link.label, link.hint, ...(link.keywords ?? [])].join(" ").toLowerCase(),
    icon: link.icon,
  };
}

export default function CommandPalette({ permissions }: { permissions: Permission[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [records, setRecords] = useState<Entry[]>([]);
  const [loadedRecords, setLoadedRecords] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(
    () => visibleGroups(permissions).flatMap((group) => group.links).map(pageEntry),
    [permissions]
  );

  /* ---------------------------------------------------------------- */
  /*  Opening                                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onRequest = () => setOpen(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onRequest);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onRequest);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    // A frame, so the input exists before it is focused.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  /* ---------------------------------------------------------------- */
  /*  Records, once                                                    */
  /* ---------------------------------------------------------------- */

  const loadRecords = useCallback(async () => {
    const supabase = createClient();
    const [contactRes, accountRes, dealRes] = await Promise.all([
      supabase
        .from("crm_contacts")
        .select("id, full_name, company, email")
        .eq("archived", false)
        .order("last_activity_at", { ascending: false })
        .limit(500),
      supabase
        .from("crm_accounts")
        .select("id, name, domain")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(300),
      supabase
        .from("crm_deals")
        .select("id, name, stage")
        .order("updated_at", { ascending: false })
        .limit(300),
    ]);

    const built: Entry[] = [];

    for (const row of rows<{ id: string; full_name: string; company: string | null; email: string | null }>(contactRes)) {
      built.push({
        id: `contact:${row.id}`,
        kind: "contact",
        label: row.full_name,
        hint: row.company || row.email || "No company recorded",
        href: `/admin/dashboard/crm?contact=${row.id}`,
        haystack: `${row.full_name} ${row.company ?? ""} ${row.email ?? ""}`.toLowerCase(),
        icon: Contact,
      });
    }

    for (const row of rows<{ id: string; name: string; domain: string | null }>(accountRes)) {
      built.push({
        id: `account:${row.id}`,
        kind: "account",
        label: row.name,
        hint: row.domain || "No web address",
        href: `/admin/dashboard/accounts?account=${row.id}`,
        haystack: `${row.name} ${row.domain ?? ""}`.toLowerCase(),
        icon: Building2,
      });
    }

    for (const row of rows<{ id: string; name: string; stage: string }>(dealRes)) {
      built.push({
        id: `deal:${row.id}`,
        kind: "deal",
        label: row.name,
        hint: row.stage,
        href: `/admin/dashboard/deals?deal=${row.id}`,
        haystack: `${row.name} ${row.stage}`.toLowerCase(),
        icon: Handshake,
      });
    }

    setRecords(built);
    setLoadedRecords(true);
  }, []);

  useEffect(() => {
    if (!open || loadedRecords) return;
    void loadRecords();
  }, [open, loadedRecords, loadRecords]);

  /* ---------------------------------------------------------------- */
  /*  Matching                                                         */
  /* ---------------------------------------------------------------- */

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    // Nothing typed: the destinations, which is what a shortcut is for.
    if (!needle) return pages.slice(0, LIMIT);

    const hit = (entry: Entry) => entry.haystack.includes(needle);
    const rank = (entry: Entry) => (entry.label.toLowerCase().startsWith(needle) ? 0 : 1);

    return [...pages.filter(hit), ...records.filter(hit)]
      .sort((a, b) => rank(a) - rank(b) || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
      .slice(0, LIMIT);
  }, [query, pages, records]);

  useEffect(() => setCursor(0), [query]);

  const go = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      setOpen(false);
      router.push(entry.href);
    },
    [router]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[cursor]);
    }
  };

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor, results]);

  if (!open) return null;

  let lastKind: Kind | null = null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 sm:p-6">
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the console"
        className="relative mt-[8vh] w-full max-w-xl rounded-2xl border border-white/10 bg-[#0C0C0C] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/5">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, people, companies and deals"
            aria-label="Search the console"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
          <kbd className="shrink-0 text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-500">
              {loadedRecords
                ? "Nothing matches. Try a company name, a person, or a page."
                : "Reading people and companies…"}
            </p>
          ) : (
            results.map((entry, index) => {
              const Icon = entry.icon;
              const heading = entry.kind !== lastKind ? KIND_LABEL[entry.kind] : null;
              lastKind = entry.kind;
              const active = index === cursor;

              return (
                <React.Fragment key={entry.id}>
                  {heading && (
                    <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 px-4 pt-3 pb-1.5">
                      {heading}
                    </span>
                  )}
                  <button
                    type="button"
                    data-active={active}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(entry)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white truncate">{entry.label}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">{entry.hint}</span>
                    </span>
                    {active && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
