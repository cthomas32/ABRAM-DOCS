"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveRestore, Building2, Loader2, Save, User, X } from "lucide-react";
import { DEAL_STAGES, formatMoney } from "@/lib/crm/constants";
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import Overline from "@/components/admin/Overline";
import {
  ACCOUNT_LIFECYCLES,
  createAccount,
  setAccountArchived,
  updateAccount,
  type AccountInput,
  type AccountLifecycle,
} from "./actions";

/**
 * One company, the people at it, and the deals hanging off it.
 *
 * Three of these fields are not description, they are policy:
 *
 *   first contact   a registration filed after this instant is void, so
 *                   the registration guard reads it. Nothing else writes
 *                   it, which is why it is editable here.
 *   comped,
 *   company managed,
 *   carve out       each removes the account from commission entirely.
 *                   They are stated in one sentence apiece rather than
 *                   left as three unexplained switches, because somebody
 *                   flicking one is deciding that nobody gets paid.
 */

interface AccountDrawerProps {
  /** Null opens the panel on a blank account. */
  account: CrmAccount | null;
  /** People and deals already on this account. Empty for a new one. */
  contacts: CrmContact[];
  deals: CrmDeal[];
  memberNameById: Record<string, string>;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface Fields {
  name: string;
  domain: string;
  website: string;
  industry: string;
  sizeBand: string;
  city: string;
  country: string;
  lifecycle: AccountLifecycle;
  firstContactOn: string;
  isComped: boolean;
  isCompanyManaged: boolean;
  carveOut: string;
  notes: string;
}

/** The stored instant, as the day part a date input can hold. */
function toDayInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function fieldsFrom(account: CrmAccount | null): Fields {
  return {
    name: account?.name ?? "",
    domain: account?.domain ?? "",
    website: account?.website ?? "",
    industry: account?.industry ?? "",
    sizeBand: account?.size_band ?? "",
    city: account?.city ?? "",
    country: account?.country ?? "",
    lifecycle: account?.lifecycle ?? "prospect",
    firstContactOn: toDayInput(account?.first_contact_at),
    isComped: account?.is_comped ?? false,
    isCompanyManaged: account?.is_company_managed ?? false,
    carveOut: account?.carve_out ?? "",
    notes: account?.notes ?? "",
  };
}

export default function AccountDrawer({
  account,
  contacts,
  deals,
  memberNameById,
  canManage,
  onClose,
  onSaved,
}: AccountDrawerProps) {
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(account));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isNew = account === null;

  useEffect(() => {
    setFields(fieldsFrom(account));
    setMessage(null);
  }, [account?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const input: AccountInput = {
    name: fields.name,
    domain: fields.domain || null,
    website: fields.website || null,
    industry: fields.industry || null,
    sizeBand: fields.sizeBand || null,
    city: fields.city || null,
    country: fields.country || null,
    lifecycle: fields.lifecycle,
    firstContactAt: fields.firstContactOn ? `${fields.firstContactOn}T12:00:00Z` : null,
    isComped: fields.isComped,
    isCompanyManaged: fields.isCompanyManaged,
    carveOut: fields.carveOut || null,
    notes: fields.notes || null,
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = account ? await updateAccount(account.id, input) : await createAccount(input);
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error ?? "That did not save.");
      return;
    }
    onSaved();
    if (isNew) onClose();
    else setMessage("Saved.");
  };

  const toggleArchive = async () => {
    if (!account) return;
    setBusy(true);
    const result = await setAccountArchived(account.id, !account.archived);
    setBusy(false);
    if (!result.ok) setMessage(result.error ?? "That did not save.");
    else onSaved();
  };

  const excluded = fields.isComped || fields.isCompanyManaged || Boolean(fields.carveOut.trim());

  return (
    <AnimatePresence>
      <motion.div
        key="crm-account-drawer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] flex"
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "New account" : `Account ${account?.name}`}
      >
        <div
          onClick={onClose}
          aria-hidden="true"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="relative ml-auto w-full sm:max-w-[480px] h-full bg-[#0C0C0C] border-l border-white/8 flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold tracking-tight text-white break-words">
                  {isNew ? "New account" : account?.name}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500">
                  <span className="break-words">
                    {fields.domain || "No web address on file"}
                  </span>
                  {!isNew && (
                    <>
                      <span className="text-white/15">·</span>
                      <span>
                        {contacts.length} {contacts.length === 1 ? "person" : "people"}
                      </span>
                      <span className="text-white/15">·</span>
                      <span>
                        {deals.length} {deals.length === 1 ? "deal" : "deals"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close account"
                className="shrink-0 w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isNew && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-400 capitalize">
                  {fields.lifecycle}
                </span>
                {excluded && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-400">
                    Pays no commission
                  </span>
                )}
                {account?.archived && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 border border-zinc-500/20 text-zinc-400">
                    Archived
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-6">
            {message && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                <p className="text-[11px] text-zinc-300 leading-relaxed">{message}</p>
              </div>
            )}

            <section className="space-y-3">
              <SectionLabel>Company</SectionLabel>

              <Field label="Name">
                <input
                  value={fields.name}
                  onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Helix Post"
                  className="admin-input h-11 sm:h-9 py-0"
                />
              </Field>

              <Field label="Web address">
                <input
                  inputMode="url"
                  value={fields.domain}
                  onChange={(e) => setFields((f) => ({ ...f, domain: e.target.value }))}
                  placeholder="helix.com"
                  className="admin-input h-11 sm:h-9 py-0"
                />
              </Field>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Stored lowercased, and it is what stops the same company being added twice. Company
                names get typed three different ways, a domain is one string.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Industry">
                  <input
                    value={fields.industry}
                    onChange={(e) => setFields((f) => ({ ...f, industry: e.target.value }))}
                    placeholder="Post production"
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </Field>

                <Field label="Size">
                  <input
                    value={fields.sizeBand}
                    onChange={(e) => setFields((f) => ({ ...f, sizeBand: e.target.value }))}
                    placeholder="11 to 50"
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </Field>

                <Field label="City">
                  <input
                    value={fields.city}
                    onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </Field>

                <Field label="Country">
                  <input
                    value={fields.country}
                    onChange={(e) => setFields((f) => ({ ...f, country: e.target.value }))}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </Field>

                <Field label="Website">
                  <input
                    inputMode="url"
                    value={fields.website}
                    onChange={(e) => setFields((f) => ({ ...f, website: e.target.value }))}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </Field>

                <Field label="Lifecycle">
                  <select
                    value={fields.lifecycle}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, lifecycle: e.target.value as AccountLifecycle }))
                    }
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    {ACCOUNT_LIFECYCLES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  rows={4}
                  value={fields.notes}
                  onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
                  className="admin-input resize-y leading-relaxed"
                />
              </Field>
            </section>

            {/* First contact */}
            <section className="space-y-3">
              <SectionLabel>First contact</SectionLabel>
              <Field label="Date">
                <input
                  type="date"
                  value={fields.firstContactOn}
                  onChange={(e) => setFields((f) => ({ ...f, firstContactOn: e.target.value }))}
                  className="admin-input h-11 sm:h-9 py-0"
                />
              </Field>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                The day anybody here first spoke to anybody there. A deal registration filed after
                this date is refused, so it settles a dispute rather than starting one. Leave it
                empty while the account is untouched.
              </p>
            </section>

            {/* Exclusions */}
            <section className="space-y-3">
              <SectionLabel>Commission exclusions</SectionLabel>

              <Switch
                checked={fields.isComped}
                onChange={(value) => setFields((f) => ({ ...f, isComped: value }))}
                label="Comped"
                hint="On the platform without paying. There is no cash to pay a percentage of."
              />

              <Switch
                checked={fields.isCompanyManaged}
                onChange={(value) => setFields((f) => ({ ...f, isCompanyManaged: value }))}
                label="Company managed"
                hint="Run by the company rather than by a partner, so it pays no commission."
              />

              <Field label="Carve out">
                <input
                  value={fields.carveOut}
                  onChange={(e) => setFields((f) => ({ ...f, carveOut: e.target.value }))}
                  placeholder="abry_portfolio"
                  className="admin-input h-11 sm:h-9 py-0"
                />
              </Field>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Names an agreement that removes this account from commission entirely. Any value
                here means the ledger skips it, whoever sourced or closed it.
              </p>

              {excluded && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    Nothing on this account pays commission while any of these is set.
                  </p>
                </div>
              )}
            </section>

            {canManage && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="btn-primary h-11 sm:h-9 px-4 text-xs disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : isNew ? "Create account" : "Save account"}
                </button>

                {!isNew && (
                  <button
                    type="button"
                    onClick={() => void toggleArchive()}
                    disabled={busy}
                    className="btn-glass h-11 sm:h-9 px-4 text-xs disabled:opacity-50"
                  >
                    {account?.archived ? (
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                    {account?.archived ? "Restore" : "Archive"}
                  </button>
                )}
              </div>
            )}

            {/* Rolled up */}
            {!isNew && (
              <section className="space-y-3">
                <SectionLabel>People</SectionLabel>
                {contacts.length === 0 ? (
                  <div className="py-8 text-center rounded-lg border border-dashed border-white/[0.06]">
                    <User className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <h5 className="text-xs font-medium text-zinc-400 mb-1">Nobody here yet</h5>
                    <p className="text-[11px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
                      Set this account on a contact and they roll up into this list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <span className="block text-sm font-medium text-white truncate">
                          {contact.full_name}
                        </span>
                        <span className="block mt-1 text-[11px] text-zinc-500 truncate">
                          {[contact.job_title, contact.email].filter(Boolean).join(" · ") ||
                            "No job title or email"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {!isNew && (
              <section className="space-y-3">
                <SectionLabel>Deals</SectionLabel>
                {deals.length === 0 ? (
                  <div className="py-8 text-center rounded-lg border border-dashed border-white/[0.06]">
                    <Building2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <h5 className="text-xs font-medium text-zinc-400 mb-1">No deal here yet</h5>
                    <p className="text-[11px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
                      Deals created against this account appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deals.map((deal) => {
                      const spec = DEAL_STAGES.find((s) => s.id === deal.stage) ?? DEAL_STAGES[0];
                      return (
                        <div
                          key={deal.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="block text-sm font-medium text-white truncate">
                              {deal.name}
                            </span>
                            <span className="block mt-1 text-[11px] text-zinc-500">
                              {(deal.owner_user_id && memberNameById[deal.owner_user_id]) ||
                                "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-zinc-400 tabular-nums">
                              {formatMoney(deal.amount_cents, deal.currency)}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${spec.badge}`}
                            >
                              {spec.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {!isNew && (
              <section className="space-y-2">
                <SectionLabel>Credit</SectionLabel>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 border-b border-white/5">
                  <span className="text-[11px] text-zinc-500">Sourced by</span>
                  <span className="text-[11px] text-zinc-300">
                    {(account?.sourced_by && memberNameById[account.sourced_by]) ||
                      "Nobody. It walked in."}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-1.5">
                  <span className="text-[11px] text-zinc-500">Owner</span>
                  <span className="text-[11px] text-zinc-300">
                    {(account?.owner_user_id && memberNameById[account.owner_user_id]) ||
                      "Unassigned"}
                  </span>
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Bits                                                               */
/* ------------------------------------------------------------------ */

/**
 * A section header inside the panel, and a label above a field.
 *
 * Both are the shared `Overline`, so the label recipe lives in exactly
 * one file. All these add is the placement: a hairline under a section
 * heading, and the wrapping `label` element around a field.
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Overline as="h3" className="pb-1 border-b border-white/5">
      {children}
    </Overline>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Overline className="mb-1.5">{label}</Overline>
      {children}
    </label>
  );
}

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 shrink-0 accent-white cursor-pointer"
      />
      <span className="min-w-0">
        <span className="block text-xs text-white">{label}</span>
        <span className="block text-[11px] text-zinc-500 leading-relaxed">{hint}</span>
      </span>
    </label>
  );
}
