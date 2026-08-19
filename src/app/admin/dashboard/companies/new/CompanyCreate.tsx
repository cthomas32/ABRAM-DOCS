"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { ObjectHeader } from "@/components/admin/ObjectTabs";
import CompanyFields, {
  companyInputFrom,
  emptyCompanyFields,
  type CompanyFieldValues,
} from "../CompanyFields";
import { createAccount } from "../actions";

/**
 * A new company, on its own address.
 *
 * This is the last thing `AccountDrawer` was still open for. Reading and
 * editing a company moved to `companies/[id]` weeks ago, and the drawer
 * survived on one branch: `account === null`. Six hundred lines held open
 * by a null check.
 *
 * The fields come from `../CompanyFields`, which the record page also
 * uses, so the two cannot drift.
 *
 * TWO DIFFERENCES FROM THE RECORD PAGE, AND BOTH ARE DELIBERATE.
 *
 * There is no dirty count. A create form is dirty from the moment it
 * exists, so counting changes against a blank company would say "three
 * unsaved changes" about a company that does not exist yet, which is a
 * sentence about the wrong thing. The bar is always shown and says what
 * the button will do.
 *
 * There is no archive, no tabs and no related records. A company with no
 * id has no people, no deals and no history, and drawing an empty
 * timeline beside a form nobody has submitted is furniture.
 *
 * On success this replaces rather than pushes, so Back goes to the list
 * the reader came from and not to a create form for a company that now
 * exists.
 */

export default function CompanyCreate() {
  const router = useRouter();
  const [fields, setFields] = useState<CompanyFieldValues>(emptyCompanyFields);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CompanyFieldValues>(key: K, value: CompanyFieldValues[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const named = Boolean(fields.name.trim());

  async function create() {
    if (!named || saving) return;
    setSaving(true);
    setError(null);

    const outcome = await createAccount(companyInputFrom(fields));

    if (!outcome.ok || !outcome.accountId) {
      setSaving(false);
      setError(outcome.error ?? "That company could not be created.");
      return;
    }

    /* Left saving, on purpose. The redirect is in flight and re-enabling
       the button would invite a second company. */
    router.replace(`/admin/dashboard/companies/${outcome.accountId}`);
  }

  /* Cmd+S creates, matching the record page's save. Only while the form
     can actually be submitted, so the browser's own Save keeps working
     when the company has no name yet. */
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && named && !saving) {
        event.preventDefault();
        void create();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [named, saving, fields]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <Link
            href="/admin/dashboard/companies"
            className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Companies
          </Link>
          <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">
            /
          </span>
          <span className="text-[11px] text-zinc-500 truncate">New company</span>
        </nav>

        <ObjectHeader title={fields.name.trim() || "New company"}>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
            {fields.domain.trim() || "No web address yet"}
          </p>
        </ObjectHeader>

        {/* One column. The record page's right column is history and
            related records, and a company that does not exist has none. */}
        <div className="mt-6 max-w-3xl space-y-7">
          <CompanyFields fields={fields} set={set} />
        </div>

        <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-zinc-400 leading-relaxed min-w-0">
            {error ? (
              <span className="text-amber-200">{error}</span>
            ) : named ? (
              "Everything here can be changed afterwards."
            ) : (
              "A company needs a name before it can be created."
            )}
          </span>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Link
              href="/admin/dashboard/companies"
              className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => void create()}
              disabled={!named || saving}
              className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {saving ? "Creating" : "Create company"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
