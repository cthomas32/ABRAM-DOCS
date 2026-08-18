"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Phone } from "lucide-react";
import { FieldLabel } from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import { CONTROL_HEIGHT } from "@/lib/crm/blockStyles";
import { logContactActivity } from "../tasks/actions";

/**
 * Logging what just happened.
 *
 * It sits at the top of the list it writes into, because the moment
 * somebody wants to record a call is the moment they have just finished
 * one and are looking at the others. Everything here is one row: person,
 * what it was, when, and a line about it.
 *
 * The activity reporting counts exactly these rows, so a call logged here
 * is a call that shows up in the numbers on the money screen. Nothing
 * else produces them.
 */
export default function LogActivity({
  contacts,
}: {
  contacts: { id: string; full_name: string; company: string | null }[];
}) {
  const [contactId, setContactId] = useState("");
  const [kind, setKind] = useState<"call" | "meeting">("call");
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!contactId) return;
        startTransition(async () => {
          const result = await logContactActivity({
            contactId,
            kind,
            body,
            occurredAt: occurredAt || null,
          });
          setNotice(result.error ?? "Logged.");
          if (result.ok) {
            setBody("");
            setOccurredAt("");
          }
        });
      }}
    >
      {notice && <Panel title="What happened">{notice}</Panel>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="log-contact">Who it was with</FieldLabel>
          <select
            id="log-contact"
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
            className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
          >
            <option value="">Pick somebody</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.full_name}
                {contact.company ? ` · ${contact.company}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="log-kind">What it was</FieldLabel>
          <select
            id="log-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as "call" | "meeting")}
            className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
          >
            <option value="call">A call</option>
            <option value="meeting">A meeting</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="log-when" hint="(defaults to now)">
            When
          </FieldLabel>
          <input
            id="log-when"
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className={`admin-input ${CONTROL_HEIGHT} py-0`}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="log-body" hint="(optional)">
          What was said
        </FieldLabel>
        <textarea
          id="log-body"
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="admin-input"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !contactId}
        className={`btn-primary px-4 ${CONTROL_HEIGHT} text-xs rounded-full disabled:opacity-50`}
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
        Log it
      </button>
    </form>
  );
}
