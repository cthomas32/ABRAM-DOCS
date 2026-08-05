"use client";

import EmailTemplatesEditor from "./EmailTemplatesEditor";

/**
 * Editing the emails the conference capture sends.
 *
 * Sits under the CRM console rather than beside the broadcast composer,
 * because this is one of the things that happens between a scan and a
 * reply and it belongs where the rest of that lives.
 */
export default function CrmEmailsPage() {
  /* The console shell is a fixed height box: the surrounding <main> is
     `md:h-screen md:overflow-hidden`, so a page that does not bring its own
     scrolling ancestor simply gets cut off at the fold on a desktop with no
     way to reach the rest. Every other route under the CRM does this, and
     this one was the exception. */
  return (
    <div className="flex-1 overflow-y-auto">
      <EmailTemplatesEditor />
    </div>
  );
}
