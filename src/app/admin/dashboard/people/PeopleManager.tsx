"use client";

import React, { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle,
  KeyRound,
  Loader2,
  Percent,
  UserPlus,
} from "lucide-react";
import {
  GROWTH_STAGE_DESCRIPTIONS,
  GROWTH_STAGE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type ConsoleRole,
  type GrowthStage,
} from "@/lib/auth/permissions";
import { formatRate } from "@/lib/crm/constants";
import { inviteTeammate, setActive, setPartnerTerms, setRole } from "./actions";
import type { PersonRow } from "./AccessPanel";

/**
 * The one screen where access is granted and what it pays is recorded.
 *
 * Written so that the consequence of every control is on the screen next
 * to it. A role dropdown that says only "Growth" leaves the reader to
 * remember what growth means; the description under it is what stops a
 * mis-set role being discovered three weeks later.
 */

const ROLES: ConsoleRole[] = ["owner", "admin", "growth", "contributor", "viewer"];
const STAGES: GrowthStage[] = ["advisor", "head_of_growth", "employee"];

type Feedback = { tone: "success" | "error"; message: string } | null;

export default function PeopleManager({
  people,
  viewerId,
}: {
  people: PersonRow[];
  viewerId: string;
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [termsFor, setTermsFor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const report = (result: { ok: boolean; error?: string }, success: string) => {
    setFeedback(
      result.ok
        ? { tone: "success", message: success }
        : { tone: "error", message: result.error || "Something went wrong." }
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-3 inline-block font-sans">
          People &amp; Access
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Who can get in, and what it pays
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          A role decides which surfaces somebody sees. For a growth partner it also decides how much
          of the pipeline is visible. Commission rates are kept as a history, so advancing a stage
          never restates a month already paid.
        </p>
      </header>

      {feedback && (
        <div
          className={`rounded-xl border p-3 flex gap-2.5 mb-6 ${
            feedback.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          )}
          <p
            className={`text-[11px] leading-relaxed ${
              feedback.tone === "success" ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {feedback.message}
          </p>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setInviteOpen((open) => !open)}
          className="btn-primary rounded-full text-xs px-4 py-2.5 inline-flex items-center gap-1.5 min-h-11"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite somebody
        </button>
      </div>

      {inviteOpen && (
        <InviteForm
          pending={pending}
          onSubmit={(values) =>
            startTransition(async () => {
              const result = await inviteTeammate(values);
              report(result, `Invitation sent to ${values.email}.`);
              if (result.ok) setInviteOpen(false);
            })
          }
          onCancel={() => setInviteOpen(false)}
        />
      )}

      <div className="space-y-3 mt-6">
        {people.map((person) => {
          const isSelf = person.userId === viewerId;

          return (
            <div
              key={person.userId}
              className={`rounded-2xl border p-4 sm:p-5 ${
                person.isActive
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-white/5 bg-white/[0.01] opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-white break-words">
                      {person.fullName || person.email}
                    </h2>
                    {isSelf && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-zinc-400">
                        you
                      </span>
                    )}
                    {!person.isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 text-zinc-400">
                        deactivated
                      </span>
                    )}
                  </div>
                  {person.fullName && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 break-words">{person.email}</p>
                  )}
                </div>

                <button
                  onClick={() =>
                    startTransition(async () => {
                      const result = await setActive({
                        userId: person.userId,
                        isActive: !person.isActive,
                      });
                      report(
                        result,
                        person.isActive ? "Access removed." : "Access restored."
                      );
                    })
                  }
                  disabled={pending || isSelf}
                  className="btn-ghost rounded-full text-[11px] px-3 py-2 min-h-11 disabled:opacity-40"
                  title={isSelf ? "You cannot deactivate your own account." : undefined}
                >
                  {person.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>

              {/* Role */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
                    Role
                  </label>
                  <select
                    value={person.role}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        const nextRole = e.target.value as ConsoleRole;
                        const result = await setRole({
                          userId: person.userId,
                          role: nextRole,
                          growthStage:
                            nextRole === "growth" ? person.growthStage ?? "advisor" : null,
                        });
                        report(result, `${person.fullName || person.email} is now ${ROLE_LABELS[nextRole]}.`);
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                    {ROLE_DESCRIPTIONS[person.role]}
                  </p>
                </div>

                {person.role === "growth" && (
                  <div>
                    <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
                      Stage
                    </label>
                    <select
                      value={person.growthStage ?? "advisor"}
                      disabled={pending}
                      onChange={(e) =>
                        startTransition(async () => {
                          const stage = e.target.value as GrowthStage;
                          const result = await setRole({
                            userId: person.userId,
                            role: "growth",
                            growthStage: stage,
                          });
                          report(result, `Stage set to ${GROWTH_STAGE_LABELS[stage]}.`);
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
                    >
                      {STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {GROWTH_STAGE_LABELS[stage]}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                      {GROWTH_STAGE_DESCRIPTIONS[person.growthStage ?? "advisor"]}
                    </p>
                  </div>
                )}
              </div>

              {/* Commission terms */}
              {person.role === "growth" && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Percent className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      {person.terms ? (
                        <span className="text-[11px] text-zinc-400">
                          <strong className="text-zinc-200">
                            {formatRate(person.terms.close_rate)}
                          </strong>{" "}
                          closed ·{" "}
                          <strong className="text-zinc-200">
                            {formatRate(person.terms.source_rate)}
                          </strong>{" "}
                          sourced · {person.terms.tail_months}-month tail · since{" "}
                          {person.terms.effective_from}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400">
                          No rates recorded — nothing will be calculated.
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setTermsFor(termsFor === person.userId ? null : person.userId)
                      }
                      className="btn-glass rounded-full text-[11px] px-3 py-2 min-h-11 shrink-0"
                    >
                      {person.terms ? "Change rates" : "Set rates"}
                    </button>
                  </div>

                  {termsFor === person.userId && (
                    <TermsForm
                      person={person}
                      pending={pending}
                      onSubmit={(values) =>
                        startTransition(async () => {
                          const result = await setPartnerTerms({
                            userId: person.userId,
                            ...values,
                          });
                          report(result, "New rates recorded. Earlier months are unaffected.");
                          if (result.ok) setTermsFor(null);
                        })
                      }
                      onCancel={() => setTermsFor(null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InviteForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (values: {
    email: string;
    fullName: string;
    role: ConsoleRole;
    growthStage: GrowthStage | null;
  }) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ConsoleRole>("growth");
  const [growthStage, setGrowthStage] = useState<GrowthStage>("advisor");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email, fullName, role, growthStage: role === "growth" ? growthStage : null });
      }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inv-email" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
            Email
          </label>
          <input
            id="inv-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@abram.network"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/25 min-h-11"
          />
        </div>
        <div>
          <label htmlFor="inv-name" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
            Name
          </label>
          <input
            id="inv-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="inv-role" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
            Role
          </label>
          <select
            id="inv-role"
            value={role}
            onChange={(e) => setRole(e.target.value as ConsoleRole)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        {role === "growth" && (
          <div>
            <label htmlFor="inv-stage" className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
              Stage
            </label>
            <select
              id="inv-stage"
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {GROWTH_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
              {GROWTH_STAGE_DESCRIPTIONS[growthStage]}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className="btn-primary rounded-full text-xs px-4 py-2.5 inline-flex items-center gap-1.5 min-h-11 disabled:opacity-60">
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Send invitation
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost rounded-full text-xs px-4 py-2.5 min-h-11">
          Cancel
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 leading-relaxed flex gap-1.5">
        <KeyRound className="w-3 h-3 shrink-0 mt-0.5" />
        They receive an email to set a password. Their role is saved immediately, so they land in
        the right place the first time they sign in.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function TermsForm({
  person,
  pending,
  onSubmit,
  onCancel,
}: {
  person: PersonRow;
  pending: boolean;
  onSubmit: (values: {
    stage: GrowthStage;
    closeRatePct: number;
    sourceRatePct: number;
    tailMonths: number;
    clawbackDays: number;
    effectiveFrom: string;
    note: string;
  }) => void;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState<GrowthStage>(person.growthStage ?? "advisor");
  const [closeRatePct, setCloseRatePct] = useState(
    person.terms ? String(person.terms.close_rate * 100) : "20"
  );
  const [sourceRatePct, setSourceRatePct] = useState(
    person.terms ? String(person.terms.source_rate * 100) : "10"
  );
  const [tailMonths, setTailMonths] = useState(String(person.terms?.tail_months ?? 12));
  const [clawbackDays, setClawbackDays] = useState(String(person.terms?.clawback_days ?? 90));
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          stage,
          closeRatePct: Number(closeRatePct),
          sourceRatePct: Number(sourceRatePct),
          tailMonths: Number(tailMonths),
          clawbackDays: Number(clawbackDays),
          effectiveFrom,
          note,
        });
      }}
      className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 space-y-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Closed %" value={closeRatePct} onChange={setCloseRatePct} type="number" />
        <Field label="Sourced %" value={sourceRatePct} onChange={setSourceRatePct} type="number" />
        <Field label="Tail months" value={tailMonths} onChange={setTailMonths} type="number" />
        <Field label="Clawback days" value={clawbackDays} onChange={setClawbackDays} type="number" />
        <Field label="From" value={effectiveFrom} onChange={setEffectiveFrom} type="date" />
        <div>
          <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
            Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as GrowthStage)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {GROWTH_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
          Note <span className="text-zinc-400 normal-case tracking-normal">(optional)</span>
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Advanced to Head of Growth on reaching $1,000 MRR."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/25 min-h-11"
        />
      </div>

      <p className="text-[10px] text-zinc-400 leading-relaxed">
        The current rates stop the day before this date. Nothing already calculated changes — every
        commission line keeps the rate it was worked out at.
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary rounded-full text-xs px-4 py-2.5 inline-flex items-center gap-1.5 min-h-11 disabled:opacity-60">
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Record rates
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost rounded-full text-xs px-4 py-2.5 min-h-11">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-400 block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 min-h-11"
      />
    </div>
  );
}
