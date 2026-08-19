"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Code2,
  Eye,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Send,
  Type,
} from "lucide-react";
import {
  CRM_EMAIL_VARIABLES,
  crmEmailProblem,
  crmEmailTemplateSpec,
  renderCrmEmail,
  type CrmEmailContent,
  type CrmEmailValues,
} from "@/lib/crm/emailTemplates";
import {
  loadCrmEmailAdminData,
  resetCrmEmailTemplate,
  saveCrmEmailTemplate,
  sendCrmEmailTest,
} from "./actions";
import type { CrmEmailAdminRow } from "./types";

/**
 * The words the follow up is made of.
 *
 * One screen, and the thing it is really for is the panel on the right.
 * Copy that lands in a stranger's inbox an hour after a handshake lives or
 * dies on whether the line breaks look typed, and no amount of reading the
 * template tells you that. So the preview renders through exactly the same
 * function the send does, with your own signature in it, and the event
 * toggle is there because the greeting is the one line that changes shape.
 *
 * Saving is refused when the copy would not render. That is deliberate.
 * The alternative is a save that looks fine and quietly falls back to the
 * original three weeks later at a trade show.
 */

type Pane = "text" | "html";
type Field = "subject" | "bodyText" | "bodyHtml";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

function sameContent(a: CrmEmailContent, b: CrmEmailContent): boolean {
  return a.subject === b.subject && a.bodyText === b.bodyText && a.bodyHtml === b.bodyHtml;
}

function editedOn(iso: string | null): string {
  if (!iso) return "";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";
  return when.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmailTemplatesEditor() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<CrmEmailAdminRow[]>([]);
  const [previewValues, setPreviewValues] = useState<CrmEmailValues>({});
  const [testRecipient, setTestRecipient] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<CrmEmailContent>({ subject: "", bodyText: "", bodyHtml: "" });

  const [pane, setPane] = useState<Pane>("text");
  const [previewPane, setPreviewPane] = useState<Pane>("html");
  const [withEvent, setWithEvent] = useState(true);

  const [busy, setBusy] = useState<"save" | "reset" | "test" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const subjectRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<Field>("bodyText");

  const notify = useCallback((message: string, tone: "success" | "error") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Loading                                                          */
  /* ---------------------------------------------------------------- */

  const load = useCallback(async (keepKey?: string | null) => {
    setLoading(true);
    const result = await loadCrmEmailAdminData();
    setLoading(false);

    if ("error" in result) {
      setLoadError(result.error);
      return;
    }

    setLoadError(null);
    setTemplates(result.templates);
    setPreviewValues(result.previewValues);
    setTestRecipient(result.testRecipient);

    const next =
      result.templates.find((t) => t.key === keepKey) ?? result.templates[0] ?? null;
    setActiveKey(next?.key ?? null);
    if (next) setDraft({ ...next.content });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => templates.find((t) => t.key === activeKey) ?? null,
    [templates, activeKey],
  );

  const dirty = active ? !sameContent(draft, active.content) : false;
  const isDefault = active ? sameContent(draft, active.defaultContent) : false;

  /* ---------------------------------------------------------------- */
  /*  Preview                                                          */
  /* ---------------------------------------------------------------- */

  const values = useMemo<CrmEmailValues>(
    () => ({ ...previewValues, event_name: withEvent ? previewValues.event_name : "" }),
    [previewValues, withEvent],
  );

  const rendered = useMemo(() => renderCrmEmail(draft, values), [draft, values]);

  /* Which variables this email is allowed to use. A conference note and a
     welcome to the list share a renderer and almost nothing else, so the
     list beside the editor and the check below are both narrowed to the
     template in front of you rather than to everything the system knows. */
  const allowedVariables = useMemo(
    () => (activeKey ? crmEmailTemplateSpec(activeKey)?.variables : undefined),
    [activeKey],
  );

  const availableVariables = useMemo(
    () =>
      allowedVariables
        ? CRM_EMAIL_VARIABLES.filter((v) => allowedVariables.includes(v.name))
        : CRM_EMAIL_VARIABLES,
    [allowedVariables],
  );

  const problem = useMemo(
    () => crmEmailProblem(draft, allowedVariables),
    [draft, allowedVariables],
  );

  /* The preview is somebody else's HTML in an iframe, so it is sandboxed
     with nothing granted. It is a picture of an email and never a page. */
  const previewDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:20px;background:#ffffff">${rendered.html}</body></html>`,
    [rendered.html],
  );

  /* ---------------------------------------------------------------- */
  /*  Editing                                                          */
  /* ---------------------------------------------------------------- */

  const setField = (field: Field, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  /** Drops a variable where the cursor last was, which is the only place it makes sense. */
  const insertVariable = (name: string) => {
    const token = `{{${name}}}`;
    const field = lastField.current;
    const element =
      field === "subject" ? subjectRef.current : field === "bodyText" ? textRef.current : htmlRef.current;

    if (!element) {
      setField(field, `${draft[field]}${token}`);
      return;
    }

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const next = `${element.value.slice(0, start)}${token}${element.value.slice(end)}`;
    setField(field, next);

    requestAnimationFrame(() => {
      element.focus();
      const at = start + token.length;
      element.setSelectionRange(at, at);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const save = async () => {
    if (!active) return;
    setBusy("save");
    const result = await saveCrmEmailTemplate(active.key, draft);
    setBusy(null);

    if (result.error) {
      notify(result.error, "error");
      return;
    }
    notify(result.message || "Saved.", "success");
    await load(active.key);
  };

  const reset = async () => {
    if (!active) return;
    setBusy("reset");
    const result = await resetCrmEmailTemplate(active.key);
    setBusy(null);

    if (result.error) {
      notify(result.error, "error");
      return;
    }
    setDraft({ ...active.defaultContent });
    notify(result.message || "Back to the original wording.", "success");
    await load(active.key);
  };

  const sendTest = async () => {
    if (!active) return;
    setBusy("test");
    const result = await sendCrmEmailTest(active.key, draft, withEvent);
    setBusy(null);

    if (result.error) notify(result.error, "error");
    else notify(result.message || "Test sent.", "success");
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading && !templates.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm font-medium text-amber-200">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard/people"
          className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Contacts
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Follow up emails</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          The note somebody gets a minute after they leave their details on your card. Edit the
          wording here and it goes out from the next scan. Reset and the original comes back.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* The list */}
        <aside className="flex flex-col gap-2">
          <span className="mb-1 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Emails
          </span>
          {templates.map((template) => {
            const selected = template.key === activeKey;
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => {
                  setActiveKey(template.key);
                  setDraft({ ...template.content });
                }}
                className={`flex min-h-[44px] w-full flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  selected
                    ? "border-white/15 bg-white/[0.06]"
                    : "border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-medium text-white">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="break-words">{template.name}</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                  {template.source === "saved" ? "Edited" : "Original"}
                </span>
              </button>
            );
          })}
        </aside>

        {/* The editor */}
        {active ? (
          <div className="min-w-0">
            {/* Status and the three things you can do */}
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4 sm:p-5">
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-relaxed text-zinc-400">{active.description}</p>
                <p className="text-xs text-zinc-400">
                  {active.source === "saved"
                    ? `Your wording, edited ${editedOn(active.updatedAt) || "recently"}.`
                    : "Sending the original wording."}
                  {dirty ? " You have unsaved changes." : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy !== null || !dirty}
                  className="btn-primary min-h-[44px] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "save" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>

                <button
                  type="button"
                  onClick={sendTest}
                  disabled={busy !== null || Boolean(problem)}
                  className="btn-glass min-h-[44px] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "test" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send a test to myself
                </button>

                <button
                  type="button"
                  onClick={reset}
                  disabled={busy !== null || (active.source === "default" && isDefault)}
                  className="btn-ghost min-h-[44px] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "reset" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Reset to the original
                </button>
              </div>

              {testRecipient ? (
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                  A test only ever goes to {testRecipient}
                </p>
              ) : null}
            </div>

            {/* Something is wrong */}
            {active.fallbackReason ? (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-amber-200">
                    Your saved wording is being skipped and the original is sending instead.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                    {active.fallbackReason}
                  </p>
                </div>
              </div>
            ) : null}

            {problem ? (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-xs leading-relaxed text-red-200">{problem}</p>
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-2">
              {/* Left: the words */}
              <div className="min-w-0">
                <label
                  htmlFor="crm-email-subject"
                  className="mb-2 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400"
                >
                  Subject
                </label>
                <input
                  id="crm-email-subject"
                  ref={subjectRef}
                  value={draft.subject}
                  onFocus={() => (lastField.current = "subject")}
                  onChange={(e) => setField("subject", e.target.value)}
                  className="mb-5 w-full min-h-[44px] rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 font-sans text-sm text-white outline-none transition-colors placeholder:text-zinc-400 focus:border-white/20"
                  placeholder="Great to meet you"
                />

                <div className="mb-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPane("text")}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                      pane === "text"
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <Type className="h-3.5 w-3.5" />
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={() => setPane("html")}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                      pane === "html"
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    HTML
                  </button>
                </div>

                {pane === "text" ? (
                  <textarea
                    ref={textRef}
                    value={draft.bodyText}
                    onFocus={() => (lastField.current = "bodyText")}
                    onChange={(e) => setField("bodyText", e.target.value)}
                    spellCheck
                    rows={16}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-sans text-sm leading-relaxed text-zinc-200 outline-none transition-colors focus:border-white/20"
                  />
                ) : (
                  <textarea
                    ref={htmlRef}
                    value={draft.bodyHtml}
                    onFocus={() => (lastField.current = "bodyHtml")}
                    onChange={(e) => setField("bodyHtml", e.target.value)}
                    spellCheck={false}
                    rows={16}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs leading-relaxed text-zinc-200 outline-none transition-colors focus:border-white/20"
                  />
                )}

                {/* The variables */}
                <div className="mt-5 rounded-2xl border border-white/5 bg-zinc-950/40 p-4">
                  <span className="mb-1 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    What you can drop in
                  </span>
                  <p className="mb-3 text-xs leading-relaxed text-zinc-400">
                    Click one to put it where the cursor is. Anything with no value comes out
                    blank, and takes its comma or its line break with it.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable.name}
                        type="button"
                        title={variable.label}
                        onClick={() => insertVariable(variable.name)}
                        className="min-h-[44px] rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-left font-mono text-[10px] text-zinc-400 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-zinc-200"
                      >
                        <span className="block break-all">{`{{${variable.name}}}`}</span>
                        <span className="block font-sans text-[9px] uppercase tracking-widest text-zinc-400">
                          {variable.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                    For the greeting, wrap a piece in{" "}
                    <code className="font-mono text-[11px] text-zinc-400">
                      {"{{#event_name}}"} ... {"{{/event_name}}"}
                    </code>{" "}
                    to keep it only when an event is running, or{" "}
                    <code className="font-mono text-[11px] text-zinc-400">
                      {"{{^event_name}}"} ... {"{{/event_name}}"}
                    </code>{" "}
                    to keep it only when there is not one.
                  </p>
                </div>
              </div>

              {/* Right: what it looks like */}
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewPane("html")}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                        previewPane === "html"
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPane("text")}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                        previewPane === "text"
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <Type className="h-3.5 w-3.5" />
                      Plain text
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWithEvent((on) => !on)}
                    className="btn-ghost min-h-[44px]"
                  >
                    {withEvent ? <Check className="h-3.5 w-3.5" /> : null}
                    {withEvent ? "An event is running" : "No event running"}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-4">
                  <p className="mb-3 break-words text-xs text-zinc-400">
                    <span className="text-zinc-400">Subject: </span>
                    <span className="text-zinc-300">{rendered.subject || "(empty)"}</span>
                  </p>

                  {previewPane === "html" ? (
                    <iframe
                      title="What the email looks like"
                      sandbox=""
                      srcDoc={previewDoc}
                      className="h-[460px] w-full rounded-xl border border-white/5 bg-white"
                    />
                  ) : (
                    <pre className="h-[460px] w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-zinc-950/60 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                      {rendered.text || "(empty)"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">There are no editable emails in this build.</p>
        )}
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto max-w-sm rounded-xl border px-4 py-2.5 text-xs font-medium backdrop-blur-md ${
                toast.tone === "success"
                  ? "border-white/10 bg-zinc-900/90 text-zinc-200"
                  : "border-amber-500/20 bg-red-950/80 text-red-200"
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
