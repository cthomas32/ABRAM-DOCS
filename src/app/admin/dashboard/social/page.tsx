"use client";

import React, { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Image as ImageIcon, Images, LayoutGrid, LibraryBig, Wand2, X } from "lucide-react";
import SocialStudio, { blankSeed, seedFromCard, type StudioSeed } from "@/components/admin/social/SocialStudio";
import { createClient } from "@/utils/supabase/client";
import SocialLibrary from "@/components/admin/social/SocialLibrary";
import SocialCalendar from "@/components/admin/social/SocialCalendar";
import ImageLibrary from "@/components/admin/social/ImageLibrary";

/**
 * Social Studio.
 *
 * The same renderer that draws the site's link previews, pointed at every
 * size a post needs. Three parts: the calendar, which holds what goes out
 * and when, the studio, where a card is written and redrawn as you type,
 * and the library of everything made here plus whatever KIPP has proposed
 * since the last look.
 *
 * The library holds two different things and says so. **Cards** are what
 * came out of the studio, each one a spec waiting on approval. **Images**
 * are the raw pictures that go behind them, which have their own life:
 * they arrive by the dozen off a shoot, they get titled and credited long
 * before anybody makes a card out of one, and they are worth looking
 * through on their own. Filing them under Look in the studio made a shelf
 * into a dropdown.
 *
 * Nothing leaves this page on its own. Approving is what writes a PNG and
 * gives it a public address, and that is always a person's click.
 */

type Tab = "calendar" | "studio" | "library";

/** Which half of the library. Cards first: it is what the tab was. */
type LibraryView = "cards" | "images";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

export default function SocialPage() {
  const [tab, setTab] = useState<Tab>("calendar");
  const [libraryView, setLibraryView] = useState<LibraryView>("cards");
  const [seed, setSeed] = useState<StudioSeed>(blankSeed);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const notify = useCallback((message: string, tone: "success" | "error") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  /**
   * The post to go back to once the studio has saved.
   *
   * Set only when the studio was opened from a post, which is what makes
   * Edit card a round trip rather than a one-way door: a save lands you back
   * on the calendar with the sheet open where you left it. Everything else
   * still finishes in the library, where a card that belongs to nothing in
   * particular is meant to end up.
   */
  const [returnToPost, setReturnToPost] = useState<string | null>(null);

  const handleSaved = useCallback(
    (message: string, tone: "success" | "error") => {
      notify(message, tone);
      if (tone !== "success") return;
      setRefreshToken((n) => n + 1);
      setTab(returnToPost ? "calendar" : "library");
    },
    [notify, returnToPost]
  );

  const handleEdit = useCallback((next: StudioSeed) => {
    setReturnToPost(null);
    setSeed(next);
    setTab("studio");
  }, []);

  /**
   * Open a post's card in the studio.
   *
   * The card is read here rather than passed down from the post sheet, which
   * only ever held a thumbnail and a format. The spec is what the studio
   * needs, and reading it at the moment of the click means it is the current
   * one even if the card was edited in another tab.
   */
  const handleEditCard = useCallback(
    async (assetId: string, postId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("social_image_assets")
        .select("id, title, note, spec, set_id")
        .eq("id", assetId)
        .single();

      if (error || !data) {
        notify(error?.message || "That card is no longer in the library.", "error");
        return;
      }
      if (data.set_id) {
        notify("That post is on a carousel. Open it from the library to edit every slide together.", "error");
        return;
      }

      setSeed(seedFromCard(data));
      setReturnToPost(postId || null);
      setTab("studio");
    },
    [notify]
  );

  const startBlank = () => {
    setReturnToPost(null);
    setSeed(blankSeed());
    setTab("studio");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-[100rem] mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-zinc-400" />
              Social Studio
            </h1>
            {/* Two screens of scrolling before the week starts on a phone,
                for a sentence that is only ever read once. */}
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 font-sans max-w-2xl leading-relaxed">
              What goes out and when, and the images that go with it. Mark a post ready and it arrives in
              Slack the morning it is due, with the words, the link and the card already on it.
            </p>
          </div>
          {tab === "studio" ? (
            <button
              type="button"
              onClick={startBlank}
              className="btn-glass flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Start fresh
            </button>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-3">
          {(
            [
              { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
              { id: "studio" as const, label: "Studio", icon: Wand2 },
              { id: "library" as const, label: "Library", icon: LibraryBig },
            ]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                tab === id
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === "calendar" ? (
          <SocialCalendar
            onNotify={notify}
            refreshToken={refreshToken}
            onEditCard={handleEditCard}
            reopenPostId={returnToPost}
            onReopened={() => setReturnToPost(null)}
          />
        ) : tab === "studio" ? (
          <SocialStudio seed={seed} onSaved={handleSaved} onNotify={notify} />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Cards or the pictures they are built on. Two shelves, not
                two filters: nothing on one of them has a counterpart on
                the other, so switching is a change of subject. */}
            <div className="flex gap-1 p-1 rounded-full bg-white/[0.03] border border-white/8 w-fit">
              {(
                [
                  { id: "cards" as const, label: "Cards", icon: LayoutGrid },
                  { id: "images" as const, label: "Images", icon: Images },
                ]
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLibraryView(id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-colors min-h-[44px] sm:min-h-[34px] ${
                    libraryView === id ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400 leading-relaxed -mt-4">
              {libraryView === "cards"
                ? "Everything made here, and whatever KIPP has proposed since the last look."
                : "The pictures that go behind a card. Upload as many as you like, then title them and say who took them."}
            </span>

            {libraryView === "cards" ? (
              <SocialLibrary onEdit={handleEdit} onNotify={notify} refreshToken={refreshToken} />
            ) : (
              <ImageLibrary mode="browse" onNotify={notify} refreshToken={refreshToken} />
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-[calc(100vw-2.5rem)] sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`glass-panel rounded-xl px-4 py-3 flex items-start gap-3 border ${
                toast.tone === "error" ? "border-amber-500/30" : "border-white/10"
              }`}
            >
              <p className="text-xs text-zinc-200 leading-relaxed flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss"
                className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
