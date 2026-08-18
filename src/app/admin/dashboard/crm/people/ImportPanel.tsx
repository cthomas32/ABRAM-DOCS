"use client";

import React, { useMemo, useState, useTransition } from "react";
import { FileDown, Loader2, Upload } from "lucide-react";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import { CONTROL_HEIGHT } from "@/lib/crm/blockStyles";
import { createClient } from "@/utils/supabase/client";
import { rows } from "@/lib/supabase/rows";
import type { CrmContact } from "@/lib/crm/types";
import {
  guessMapping,
  parseCsv,
  readPeople,
  type ImportField,
  type ParsedCsv,
} from "@/lib/crm/csv";
import { contactsToCsv, downloadFile, stampedFilename } from "../lib";
import { convertAllSubscribers } from "../../subscribers/actions";
import {
  previewContactImport,
  runContactImport,
  type ImportOutcome,
  type ImportPreview,
} from "./importActions";

/**
 * A spreadsheet in, and a spreadsheet out.
 *
 * The order is deliberate and it is the whole design: pick a file, check
 * what each column was read as, ask what would happen, and only then
 * write. The dry run is not a nicety. An import is the one action on this
 * console that can put a thousand rows somewhere in one press, and the
 * question anybody actually has beforehand is "how many of these are
 * already here", which is exactly what the preview answers.
 *
 * Matching is on lowercased email and nothing else, and a match updates
 * the sources and the lifecycle without touching a name, a company or an
 * owner. A file is a worse source of truth than the record somebody has
 * been working.
 */

const FIELD_LABELS: { id: ImportField; label: string }[] = [
  { id: "ignore", label: "Skip this column" },
  { id: "email", label: "Email" },
  { id: "full_name", label: "Full name" },
  { id: "first_name", label: "First name" },
  { id: "last_name", label: "Last name" },
  { id: "company", label: "Company" },
  { id: "job_title", label: "Job title" },
  { id: "phone", label: "Phone" },
];

export default function ImportPanel() {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [listNotice, setListNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const read = useMemo(
    () => (parsed ? readPeople(parsed, mapping) : null),
    [parsed, mapping]
  );

  const hasEmailColumn = mapping.includes("email");

  const takeFile = async (file: File | null) => {
    setPreview(null);
    setOutcome(null);
    setNotice(null);

    if (!file) {
      setParsed(null);
      setFileName(null);
      return;
    }

    const text = await file.text();
    const result = parseCsv(text);

    if (result.headers.length === 0) {
      setParsed(null);
      setNotice("That file has no header row, so there is nothing to map.");
      return;
    }

    setParsed(result);
    setMapping(guessMapping(result.headers));
    setFileName(file.name);
  };

  /**
   * The export reads the contacts fresh rather than reusing whatever the
   * board is holding, because somebody arriving on this tab to export has
   * not necessarily loaded the board at all.
   */
  const exportEverybody = () => {
    setExporting(true);
    void (async () => {
      const supabase = createClient();
      const result = await supabase
        .from("crm_contacts")
        .select("*")
        .eq("archived", false)
        .order("met_at", { ascending: false })
        .limit(5000);

      const contacts = rows<CrmContact>(result);
      if (contacts.length === 0) {
        setNotice("There is nobody to export, or the contact table could not be read.");
      } else {
        downloadFile(
          stampedFilename("contacts", "csv"),
          "text/csv;charset=utf-8",
          contactsToCsv(contacts)
        );
      }
      setExporting(false);
    })();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {notice && <Panel title="Read this first">{notice}</Panel>}

      {/* In */}
      <section className="space-y-4">
        <Overline as="h2">Bring people in</Overline>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
          <div>
            <FieldLabel htmlFor="import-file">A CSV file</FieldLabel>
            <input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void takeFile(event.target.files?.[0] ?? null)}
              className="admin-input h-9 py-0 file:mr-3 file:h-7 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:text-[11px] file:text-white"
            />
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Anything exported from HubSpot, Mailchimp or a spreadsheet. The email column is the
              only one that has to be there: it is the only key that matches a person reliably.
            </p>
          </div>

          {parsed && (
            <>
              <div>
                <Overline className="mb-2">What each column is</Overline>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {parsed.headers.map((header, index) => (
                    <li key={`${header}-${index}`} className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400 truncate w-32 shrink-0" title={header}>
                        {header || `Column ${index + 1}`}
                      </span>
                      <select
                        value={mapping[index] ?? "ignore"}
                        aria-label={`What ${header || `column ${index + 1}`} holds`}
                        onChange={(event) => {
                          const next = [...mapping];
                          next[index] = event.target.value as ImportField;
                          setMapping(next);
                          setPreview(null);
                        }}
                        className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
                      >
                        {FIELD_LABELS.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>

              {read && (
                <StatRow
                  stats={[
                    { label: "Rows in the file", value: String(parsed.rows.length) },
                    {
                      label: "Readable",
                      value: String(read.people.length),
                      hint: fileName ?? undefined,
                    },
                    {
                      label: "Skipped",
                      value: String(read.unusable + read.duplicatesInFile),
                      hint: `${read.unusable} without an email, ${read.duplicatesInFile} repeated in the file`,
                    },
                  ]}
                />
              )}

              {!hasEmailColumn && (
                <Panel title="No column is marked as the email">
                  Nothing can be matched or created without one. Pick the column holding email
                  addresses above.
                </Panel>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending || !hasEmailColumn || !read || read.people.length === 0}
                  onClick={() =>
                    startTransition(async () => {
                      setOutcome(null);
                      setPreview(await previewContactImport(read?.people ?? []));
                    })
                  }
                  className={`btn-glass px-4 ${CONTROL_HEIGHT} text-xs font-medium rounded-full disabled:opacity-50`}
                >
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Check what would happen
                </button>

                <button
                  type="button"
                  disabled={pending || !preview?.ok}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await runContactImport(read?.people ?? []);
                      setOutcome(result);
                      setPreview(null);
                    })
                  }
                  className={`btn-primary px-4 ${CONTROL_HEIGHT} text-xs rounded-full disabled:opacity-50`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
              </div>

              {preview && (
                <Panel title={preview.ok ? "Nothing has been written yet" : "That cannot be imported"}>
                  {preview.ok
                    ? `${preview.wouldCreate} would be created, ${preview.wouldMerge} would be merged into somebody already here. Press Import to write it.`
                    : preview.error}
                </Panel>
              )}

              {outcome && (
                <Panel title={outcome.ok ? "Imported" : "That did not go"}>
                  {outcome.ok
                    ? `${outcome.created} created, ${outcome.merged} merged, ${outcome.unchanged} already up to date, ${outcome.refused} refused.` +
                      (outcome.reasons.length > 0 ? ` ${outcome.reasons.join(" ")}` : "")
                    : outcome.error}
                </Panel>
              )}
            </>
          )}
        </div>
      </section>

      {/* The mailing list, which is a feed rather than an object.
          The subscribers screen went away with the rest of the sibling
          pages, and this is the one thing it did that nothing else did:
          turn an address that asked for the newsletter into a person. */}
      <section className="space-y-4">
        <Overline as="h2">Bring the mailing list in</Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 max-w-2xl">
            A newsletter signup is a person who reached us one particular way, not a second kind of
            record. This matches each address to somebody already here, or creates them at the
            subscriber lifecycle. It runs two hundred at a time and is safe to run twice: anybody
            already matched comes back unchanged.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await convertAllSubscribers();
                setListNotice(
                  result.error ??
                    `${result.created ?? 0} created, ${result.linked ?? 0} matched, ${
                      result.unchanged ?? 0
                    } already here.`
                );
              })
            }
            className={`btn-glass px-4 ${CONTROL_HEIGHT} text-xs font-medium rounded-full disabled:opacity-50`}
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Run it
          </button>
          {listNotice && (
            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">{listNotice}</p>
          )}
        </div>
      </section>

      {/* Out */}
      <section className="space-y-4">
        <Overline as="h2">Take people out</Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 max-w-2xl">
            Every live person, one row each, in the same column order the list screen exports. To
            export a narrower set, save it as a list and export that: a list carries the filter, so
            the file and the screen agree about who is in it.
          </p>
          <button
            type="button"
            onClick={exportEverybody}
            disabled={exporting}
            className={`btn-glass px-4 ${CONTROL_HEIGHT} text-xs font-medium rounded-full disabled:opacity-50`}
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            Export everybody
          </button>
        </div>
      </section>
    </div>
  );
}
