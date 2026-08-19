"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { FieldLabel } from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import { sendContactEmail } from "@/lib/crm/contactEmail";
import { completeTask } from "@/app/admin/dashboard/tasks/actions";

/**
 * The box, and one button.
 *
 * Two things it does beyond sending. It refuses to draw a send button
 * when there is no address or the person is archived, because a button
 * that is going to fail is worse than an explanation. And when it was
 * opened from a follow up, it ticks that follow up off after a successful
 * send, so nobody has to go back and do it by hand: an email step that
 * stays open after the email went is how a queue stops being believed.
 *
 * A failure to tick is reported separately from a failure to send. The
 * send cannot be undone, and calling it a failure would be a lie.
 */
export default function Composer({
  contactId,
  to,
  archived,
  canSend,
  taskId,
  initialSubject,
  initialBody,
}: {
  contactId: string;
  to: string | null;
  archived: boolean;
  canSend: boolean;
  taskId: string | null;
  initialSubject: string;
  initialBody: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const blocked = !to
    ? "There is no email address on this person, so nothing can be sent."
    : archived
      ? "This person is archived. Bring them back before writing to them."
      : !canSend
        ? "Sending a one to one email is not available at your stage. Ask an owner if you need it."
        : null;

  const send = () => {
    startTransition(async () => {
      const result = await sendContactEmail({ contactId, subject, body });

      if (!result.ok) {
        setNotice(result.error ?? "The email could not be sent.");
        return;
      }

      setSent(true);
      let message = `Sent to ${to}.`;
      if (result.error) message += ` ${result.error}`;

      if (taskId) {
        const ticked = await completeTask({ id: taskId });
        message += ticked.ok
          ? " The follow up is ticked off."
          : " The follow up is still open, so tick it off in the queue.";
      }

      setNotice(message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {blocked && <Panel title="Nothing can go out from here">{blocked}</Panel>}
      {notice && <Panel title={sent ? "Sent" : "That did not go"}>{notice}</Panel>}

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <div>
          <FieldLabel htmlFor="compose-to">To</FieldLabel>
          <p id="compose-to" className="text-sm text-zinc-300">
            {to ?? "No address on file"}
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="compose-subject">Subject</FieldLabel>
          <input
            id="compose-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={sent}
            className="admin-input h-9 py-0 disabled:opacity-50"
          />
        </div>

        <div>
          <FieldLabel htmlFor="compose-body">The note</FieldLabel>
          <textarea
            id="compose-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={sent}
            rows={14}
            className="admin-input font-sans leading-relaxed disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={Boolean(blocked) || pending || sent || !subject.trim() || !body.trim()}
            className="btn-primary px-5 h-9 text-xs rounded-full disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sent ? "Sent" : "Send"}
          </button>
          <span className="text-[11px] text-zinc-400">
            Goes out from your address, and lands on their timeline.
          </span>
        </div>
      </div>
    </div>
  );
}
