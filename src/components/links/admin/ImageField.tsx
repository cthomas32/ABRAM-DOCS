"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { normalizeImageUrl } from "@/lib/linkHub";

/**
 * Picture picker for the link hub.
 *
 * Files are uploaded to the platform's own image storage and the public
 * address is stored, so an editor never has to find a hosting service
 * first. Pasting an address still works for images that already live
 * somewhere else.
 */

const BUCKET = "link-hub";
const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageField({
  label,
  value,
  onChange,
  folder,
  hint,
  aspect = "square",
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Keeps avatars, thumbnails and backgrounds in separate folders. */
  folder: string;
  hint?: string;
  aspect?: "square" | "wide";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = value ? normalizeImageUrl(value) : null;

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return setError("That file is not an image.");
    }
    if (file.size > MAX_BYTES) {
      return setError("Images have to be under 5 MB.");
    }

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const extension = (file.name.split(".").pop() || "png").toLowerCase().slice(0, 5);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
      const path = `${folder}/${name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrl((open) => !open)}
          className="text-[9px] font-semibold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="w-2.5 h-2.5" />
          {showUrl ? "Hide address" : "Use an address"}
        </button>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={`flex items-center gap-3 rounded-2xl border border-dashed p-3 transition-colors ${
          dragging ? "border-white/40 bg-white/[0.05]" : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <div
          className={`shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center ${
            aspect === "wide" ? "w-24 h-14" : "w-14 h-14"
          }`}
        >
          {preview ? (
            // Images can come from anywhere, so this stays a plain image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-4 h-4 text-zinc-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 min-h-[32px] rounded-full text-[11px] font-semibold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {uploading ? "Uploading" : preview ? "Replace" : "Upload"}
            </button>

            {preview ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setError(null);
                }}
                className="px-3 min-h-[32px] rounded-full text-[11px] font-semibold border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            ) : null}
          </div>

          <p className="text-[9px] text-zinc-600 mt-1.5 leading-relaxed">
            {hint || "Drop an image here or upload one. PNG, JPG, WebP or GIF up to 5 MB."}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>

      {showUrl ? (
        <input
          value={value || ""}
          placeholder="https://..."
          spellCheck={false}
          onChange={(event) => onChange(event.target.value || null)}
          className="w-full mt-2 rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-[11px] font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/20 min-h-[36px]"
        />
      ) : null}

      {error ? <p className="text-[9px] text-red-400 mt-1.5">{error}</p> : null}
    </div>
  );
}
