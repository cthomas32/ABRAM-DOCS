"use client";

import React from "react";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import { toLocalInputValue, fromLocalInputValue } from "@/lib/crm/console";
import type { CrmAccount } from "@/lib/crm/types";
import { ACCOUNT_LIFECYCLES, type AccountLifecycle } from "./lifecycles";
import type { AccountInput } from "./actions";

/**
 * The company form, once.
 *
 * `companies/[id]` edits a company and `companies/new` creates one, and
 * the fields are the same fields. Written twice they would be the same
 * fields for about a month: somebody adds a field to the record page,
 * nobody adds it to the create page, and a company can then only acquire
 * that value by being created and then edited.
 *
 * Presentational and controlled. It holds no state, performs no write,
 * and knows nothing about which page it is on. The pages own the state,
 * the save affordance and what happens afterwards, which is the part that
 * genuinely differs: one has a dirty-count bar and an archive toggle, the
 * other has a single Create button and a redirect.
 *
 * THE HELPER SENTENCES ARE POLICY. Three of these fields do not describe
 * a company, they decide whether anybody gets paid for it, and the
 * sentence under each one is the only place that is said in the product.
 * See docs/design/crm-record-pages.md section 2.2.
 */

export interface CompanyFieldValues {
  name: string;
  domain: string;
  website: string;
  industry: string;
  sizeBand: string;
  city: string;
  country: string;
  lifecycle: string;
  firstContactAt: string;
  isComped: boolean;
  isCompanyManaged: boolean;
  carveOut: string;
  notes: string;
}

/** A blank company, for the create page. */
export function emptyCompanyFields(): CompanyFieldValues {
  return {
    name: "",
    domain: "",
    website: "",
    industry: "",
    sizeBand: "",
    city: "",
    country: "",
    lifecycle: "prospect",
    firstContactAt: "",
    isComped: false,
    isCompanyManaged: false,
    carveOut: "",
    notes: "",
  };
}

/** An existing company, for the record page. */
export function companyFieldsFrom(account: CrmAccount): CompanyFieldValues {
  return {
    name: account.name ?? "",
    domain: account.domain ?? "",
    website: account.website ?? "",
    industry: account.industry ?? "",
    sizeBand: account.size_band ?? "",
    city: account.city ?? "",
    country: account.country ?? "",
    lifecycle: account.lifecycle ?? "prospect",
    firstContactAt: toLocalInputValue(account.first_contact_at),
    isComped: Boolean(account.is_comped),
    isCompanyManaged: Boolean(account.is_company_managed),
    carveOut: account.carve_out ?? "",
    notes: account.notes ?? "",
  };
}

/** What both pages hand to `createAccount` and `updateAccount`. */
export function companyInputFrom(fields: CompanyFieldValues): AccountInput {
  return {
    name: fields.name,
    domain: fields.domain || null,
    website: fields.website || null,
    industry: fields.industry || null,
    sizeBand: fields.sizeBand || null,
    city: fields.city || null,
    country: fields.country || null,
    lifecycle: fields.lifecycle as AccountLifecycle,
    firstContactAt: fromLocalInputValue(fields.firstContactAt),
    isComped: fields.isComped,
    isCompanyManaged: fields.isCompanyManaged,
    carveOut: fields.carveOut || null,
    notes: fields.notes || null,
  };
}

/** True while nothing on this account can pay a commission. */
export function companyIsExcluded(fields: CompanyFieldValues): boolean {
  return fields.isComped || fields.isCompanyManaged || Boolean(fields.carveOut.trim());
}

export function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 mt-0.5 w-10 h-6 rounded-full border transition-colors ${
          checked ? "bg-white border-white" : "bg-white/[0.03] border-white/12"
        }`}
      >
        <span
          className={`block w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-[1.125rem] bg-black" : "translate-x-1 bg-zinc-400"
          }`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-xs text-white">{label}</span>
        <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5">{hint}</span>
      </span>
    </div>
  );
}

export default function CompanyFields({
  fields,
  set,
}: {
  fields: CompanyFieldValues;
  set: <K extends keyof CompanyFieldValues>(key: K, value: CompanyFieldValues[K]) => void;
}) {
  const excluded = companyIsExcluded(fields);

  return (
    <>
      <section aria-label="Company" className="space-y-3.5">
        <Overline as="h2" className="pb-1 border-b border-white/5">
          Company
        </Overline>

        <div>
          <FieldLabel htmlFor="company-name">Name</FieldLabel>
          <input
            id="company-name"
            value={fields.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Helix Studios"
            className="admin-input h-11 sm:h-9 py-0"
          />
        </div>

        <div>
          <FieldLabel htmlFor="company-domain">Web address</FieldLabel>
          <input
            id="company-domain"
            value={fields.domain}
            onChange={(event) => set("domain", event.target.value)}
            placeholder="helix.com"
            className="admin-input h-11 sm:h-9 py-0"
          />
          <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
            Stored lowercased, and it is what stops the same company being added twice. Company
            names get typed three different ways, a domain is one string.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <Field id="company-industry" label="Industry">
            <input
              id="company-industry"
              value={fields.industry}
              onChange={(event) => set("industry", event.target.value)}
              placeholder="Post production"
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field id="company-size" label="Size">
            <input
              id="company-size"
              value={fields.sizeBand}
              onChange={(event) => set("sizeBand", event.target.value)}
              placeholder="11 to 50"
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field id="company-city" label="City">
            <input
              id="company-city"
              value={fields.city}
              onChange={(event) => set("city", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field id="company-country" label="Country">
            <input
              id="company-country"
              value={fields.country}
              onChange={(event) => set("country", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field id="company-website" label="Website">
            <input
              id="company-website"
              value={fields.website}
              onChange={(event) => set("website", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field id="company-lifecycle" label="Lifecycle">
            <select
              id="company-lifecycle"
              value={fields.lifecycle}
              onChange={(event) => set("lifecycle", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
            >
              {ACCOUNT_LIFECYCLES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <FieldLabel htmlFor="company-notes">Notes</FieldLabel>
          <textarea
            id="company-notes"
            rows={4}
            value={fields.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Anything the future you will need."
            className="admin-input resize-y leading-relaxed"
          />
        </div>
      </section>

      <section aria-label="First contact" className="space-y-3.5">
        <Overline as="h2" className="pb-1 border-b border-white/5">
          First contact
        </Overline>
        <div>
          <FieldLabel htmlFor="company-first-contact">First contact</FieldLabel>
          <input
            id="company-first-contact"
            type="datetime-local"
            value={fields.firstContactAt}
            onChange={(event) => set("firstContactAt", event.target.value)}
            className="admin-input h-11 sm:h-9 py-0"
          />
          <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
            A deal registration is only valid if it was filed before this instant. Stored rather
            than recalled, because the whole point of registration is that it settles a dispute.
          </p>
        </div>
      </section>

      <section aria-label="Commission exclusions" className="space-y-3.5">
        <Overline as="h2" className="pb-1 border-b border-white/5">
          Commission exclusions
        </Overline>

        <Switch
          checked={fields.isComped}
          onChange={(value) => set("isComped", value)}
          label="Comped"
          hint="On the platform without paying. There is no cash to pay a percentage of."
        />
        <Switch
          checked={fields.isCompanyManaged}
          onChange={(value) => set("isCompanyManaged", value)}
          label="Company managed"
          hint="Run by the company rather than by a partner, so it pays no commission."
        />

        <div>
          <FieldLabel htmlFor="company-carve-out">Carve out</FieldLabel>
          <input
            id="company-carve-out"
            value={fields.carveOut}
            onChange={(event) => set("carveOut", event.target.value)}
            placeholder="fund_portfolio"
            className="admin-input h-11 sm:h-9 py-0"
          />
          <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
            Names an agreement that removes this account from commission entirely. Any value here
            means the ledger skips it, whoever sourced or closed it.
          </p>
        </div>

        {excluded && (
          <Panel tone="attention">
            Nothing on this account pays commission while any of these is set.
          </Panel>
        )}
      </section>
    </>
  );
}
