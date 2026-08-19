import type { SupabaseClient } from "@supabase/supabase-js";
import { can, type ConsoleUser, type Permission } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/constants";
import { BRAIN_COLLECTION_IDS } from "@/lib/brain/collections";

/**
 * What a teammate can ask for.
 *
 * Two rules run through the whole file and both are worth stating.
 *
 * **The permission check here is politeness. Postgres is the lock.** Every
 * query below runs on a client that is the person who asked, so row level
 * security decides what comes back whatever this file believes. The
 * `permission` on each tool exists so a refusal reads as a closed door
 * rather than as an empty list, which is the same reason the console
 * filters its own navigation. If the two ever disagree, the database is
 * right and this file is a bug.
 *
 * **Answers are shaped for reading, not for parsing.** A tool that returns
 * a raw row hands the model forty columns of which six matter, and the
 * model then guesses which. Each tool selects the columns a person would
 * have asked for and labels them in the words the console uses, because
 * the answer is going to be read out loud to somebody.
 *
 * Nothing here can delete. The console cannot either: archiving is the
 * strongest destructive act in this system, and it is not exposed over
 * this interface at all. A conversation that can archive a person by
 * misunderstanding a sentence is not a conversation worth having.
 */

export interface McpTool {
  name: string;
  description: string;
  /** JSON Schema. The protocol calls it inputSchema. */
  inputSchema: Record<string, unknown>;
  /** Refused, in words, when the caller does not hold it. */
  permission: Permission;
  /** True when it changes something. Drawn as a warning by some clients. */
  writes?: boolean;
  run: (context: ToolContext, args: Record<string, unknown>) => Promise<string>;
}

export interface ToolContext {
  supabase: SupabaseClient;
  user: ConsoleUser;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function limit(value: unknown, fallback = 20, max = 100): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : fallback;
}

/** Escapes what ILIKE treats as wildcards, so a search for "50%" works. */
function like(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function money(cents: number | null | undefined, currency = "USD"): string {
  if (!cents) return "no amount";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function line(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/**
 * Nothing found, said usefully.
 *
 * "No results" is the wrong answer when the reason is that the reader is
 * scoped to their own accounts. A partner who searches for a company
 * somebody else owns should be told that is what happened, rather than
 * being left to conclude the company is not in the CRM and create it
 * again.
 */
function nothing(user: ConsoleUser, what: string): string {
  const scoped = !can(user, "crm.contacts.read.all");
  return scoped
    ? `No ${what} matched, within what your login can read. Your access is scoped to your own records, so this may exist and belong to somebody else.`
    : `No ${what} matched.`;
}

/**
 * The kinds a person logs by hand.
 *
 * A subset of `crm_interactions_kind_check`, and the omissions are the
 * point. `capture`, `scan` and `rescan` are written by the capture route;
 * `email_opened` and `email_clicked` by the mail webhook; `stage_change`,
 * `task_created` and the deal kinds by the actions that cause them. A
 * chat window claiming somebody opened an email would be inventing
 * evidence that the funnel reports then count.
 */
const LOGGABLE_KINDS = ["note", "call", "meeting", "demo", "email_sent"];

/* ------------------------------------------------------------------ */
/*  The tools                                                          */
/* ------------------------------------------------------------------ */

export const MCP_TOOLS: McpTool[] = [
  {
    name: "search_people",
    description:
      "Find people in the CRM by name, email or company. Returns what you can see, which for a scoped login is your own records.",
    permission: "crm.contacts.read.own",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Name, email address or company name." },
        limit: { type: "number", description: "How many to return. Up to 100, 20 by default." },
      },
      required: ["query"],
    },
    async run({ supabase, user }, args) {
      const query = str(args.query);
      if (!query) return "Give me something to search for.";

      const result = await supabase
        .from("crm_contacts")
        .select("id, full_name, email, company, job_title, stage, lifecycle_stage")
        .eq("archived", false)
        .or(
          `full_name.ilike.${like(query)},email.ilike.${like(query)},company.ilike.${like(query)}`
        )
        .order("last_activity_at", { ascending: false })
        .limit(limit(args.limit));

      if (result.error) return `That search failed: ${result.error.message}`;

      const found = rows<{
        id: string;
        full_name: string;
        email: string | null;
        company: string | null;
        job_title: string | null;
        stage: string;
        lifecycle_stage: string;
      }>(result);

      if (found.length === 0) return nothing(user, "people");

      return found
        .map(
          (person) =>
            `${person.full_name} — ${line([
              person.job_title,
              person.company,
              person.email,
              `stage: ${person.stage}`,
            ])}\n  id: ${person.id}`
        )
        .join("\n");
    },
  },

  {
    name: "get_person",
    description:
      "Everything on one person: their details, their open follow ups and the last things logged against them. Takes an id from search_people, or an email address.",
    permission: "crm.contacts.read.own",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The person's id." },
        email: { type: "string", description: "Their email address, if you do not have an id." },
      },
    },
    async run({ supabase, user }, args) {
      const id = str(args.id);
      const email = str(args.email).toLowerCase();
      if (!id && !email) return "Give me an id or an email address.";

      const query = supabase.from("crm_contacts").select("*").eq("archived", false).limit(1);
      const result = await (id ? query.eq("id", id) : query.ilike("email", like(email)));

      if (result.error) return `That lookup failed: ${result.error.message}`;

      const person = rows<Record<string, unknown>>(result)[0];
      if (!person) return nothing(user, "person");

      const [tasksRes, timelineRes] = await Promise.all([
        supabase
          .from("crm_tasks")
          .select("title, due_at, status")
          .eq("contact_id", person.id as string)
          .eq("status", "open")
          .order("due_at", { ascending: true })
          .limit(10),
        supabase
          .from("crm_interactions")
          .select("kind, body, occurred_at, author")
          .eq("contact_id", person.id as string)
          .order("occurred_at", { ascending: false })
          .limit(10),
      ]);

      const tasks = rows<{ title: string; due_at: string | null }>(tasksRes);
      const timeline = rows<{
        kind: string;
        body: string | null;
        occurred_at: string;
        author: string | null;
      }>(timelineRes);

      return [
        `${person.full_name}`,
        line([
          person.job_title as string,
          person.company as string,
          person.email as string,
          person.phone as string,
        ]),
        `Stage: ${person.stage} · Lifecycle: ${person.lifecycle_stage} · Priority: ${person.priority}`,
        `Sources: ${((person.sources as string[]) ?? []).join(", ") || "none recorded"}`,
        person.notes ? `\nNotes:\n${person.notes as string}` : null,
        tasks.length
          ? `\nOpen follow ups:\n${tasks
              .map((task) => `  - ${task.title}${task.due_at ? ` (due ${task.due_at.slice(0, 10)})` : ""}`)
              .join("\n")}`
          : "\nNo open follow ups.",
        timeline.length
          ? `\nRecently:\n${timeline
              .map(
                (entry) =>
                  `  - ${entry.occurred_at.slice(0, 10)} ${entry.kind}${entry.body ? `: ${entry.body}` : ""}${entry.author ? ` (${entry.author})` : ""}`
              )
              .join("\n")}`
          : "\nNothing logged yet.",
        `\nid: ${person.id}`,
      ]
        .filter(Boolean)
        .join("\n");
    },
  },

  {
    name: "search_companies",
    description: "Find companies by name, domain or industry.",
    permission: "crm.accounts.manage",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
    async run({ supabase, user }, args) {
      const query = str(args.query);
      if (!query) return "Give me something to search for.";

      const result = await supabase
        .from("crm_accounts")
        .select("id, name, domain, industry, lifecycle, is_comped, is_company_managed, carve_out")
        .eq("archived", false)
        .or(`name.ilike.${like(query)},domain.ilike.${like(query)},industry.ilike.${like(query)}`)
        .order("name")
        .limit(limit(args.limit));

      if (result.error) return `That search failed: ${result.error.message}`;

      const found = rows<{
        id: string;
        name: string;
        domain: string | null;
        industry: string | null;
        lifecycle: string;
        is_comped: boolean;
        is_company_managed: boolean;
        carve_out: string | null;
      }>(result);

      if (found.length === 0) return nothing(user, "companies");

      return found
        .map((account) => {
          const excluded = account.is_comped || account.is_company_managed || account.carve_out;
          return `${account.name} — ${line([
            account.domain,
            account.industry,
            account.lifecycle,
            excluded ? "pays no commission" : null,
          ])}\n  id: ${account.id}`;
        })
        .join("\n");
    },
  },

  {
    name: "get_company",
    description:
      "One company, the people at it, the deals on it, and whether anything on it pays commission.",
    permission: "crm.accounts.manage",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    async run({ supabase, user }, args) {
      const id = str(args.id);
      if (!id) return "Give me a company id.";

      const accountRes = await supabase.from("crm_accounts").select("*").eq("id", id).maybeSingle();
      const account = accountRes.data as Record<string, unknown> | null;
      if (accountRes.error || !account) return nothing(user, "company");

      const [peopleRes, dealsRes] = await Promise.all([
        supabase
          .from("crm_contacts")
          .select("full_name, job_title, email")
          .eq("account_id", id)
          .eq("archived", false)
          .limit(50),
        supabase
          .from("crm_deals")
          .select("name, stage, amount_cents, currency, expected_close_on")
          .eq("account_id", id)
          .limit(50),
      ]);

      const people = rows<{ full_name: string; job_title: string | null; email: string | null }>(
        peopleRes
      );
      const deals = rows<{
        name: string;
        stage: string;
        amount_cents: number;
        currency: string;
        expected_close_on: string | null;
      }>(dealsRes);

      const excluded = [
        account.is_comped ? "comped" : null,
        account.is_company_managed ? "company managed" : null,
        account.carve_out ? `carve out: ${account.carve_out}` : null,
      ].filter(Boolean);

      return [
        `${account.name}`,
        line([
          account.domain as string,
          account.industry as string,
          account.size_band as string,
          `lifecycle: ${account.lifecycle}`,
        ]),
        excluded.length
          ? `Pays no commission (${excluded.join(", ")}).`
          : "Nothing excludes this account from commission.",
        account.first_contact_at
          ? `First contact ${(account.first_contact_at as string).slice(0, 10)}. A deal registration filed after this is refused.`
          : "No first contact recorded.",
        people.length
          ? `\nPeople:\n${people.map((p) => `  - ${line([p.full_name, p.job_title, p.email])}`).join("\n")}`
          : "\nNobody is filed against this company.",
        deals.length
          ? `\nDeals:\n${deals
              .map(
                (d) =>
                  `  - ${d.name} (${d.stage}, ${money(d.amount_cents, d.currency)}${d.expected_close_on ? `, closes ${d.expected_close_on}` : ""})`
              )
              .join("\n")}`
          : "\nNo deals on this company.",
        `\nid: ${account.id}`,
      ].join("\n");
    },
  },

  {
    name: "search_deals",
    description:
      "Find deals by name, optionally filtered to one stage. Stages are opportunity, proposal, negotiation, won and lost.",
    permission: "crm.deals.manage",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Part of the deal name. Omit to list them all." },
        stage: {
          type: "string",
          enum: DEAL_STAGES.map((entry) => entry.id),
        },
        limit: { type: "number" },
      },
    },
    async run({ supabase, user }, args) {
      const query = str(args.query);
      const stage = str(args.stage);

      let builder = supabase
        .from("crm_deals")
        .select("id, name, stage, amount_cents, mrr_cents, currency, expected_close_on, account_id")
        .order("updated_at", { ascending: false })
        .limit(limit(args.limit));

      if (query) builder = builder.ilike("name", like(query));
      if (stage && DEAL_STAGES.some((entry) => entry.id === stage)) {
        builder = builder.eq("stage", stage);
      }

      const result = await builder;
      if (result.error) return `That search failed: ${result.error.message}`;

      const found = rows<{
        id: string;
        name: string;
        stage: string;
        amount_cents: number;
        currency: string;
        expected_close_on: string | null;
      }>(result);

      if (found.length === 0) return nothing(user, "deals");

      return found
        .map(
          (deal) =>
            `${deal.name} — ${line([
              deal.stage,
              money(deal.amount_cents, deal.currency),
              deal.expected_close_on ? `closes ${deal.expected_close_on}` : null,
            ])}\n  id: ${deal.id}`
        )
        .join("\n");
    },
  },

  {
    name: "get_deal",
    description:
      "One deal, its figures, and the attribution rule that decides whether it pays commission and to whom.",
    permission: "crm.deals.manage",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    async run({ supabase, user }, args) {
      const id = str(args.id);
      if (!id) return "Give me a deal id.";

      const dealRes = await supabase.from("crm_deals").select("*").eq("id", id).maybeSingle();
      const deal = dealRes.data as Record<string, unknown> | null;
      if (dealRes.error || !deal) return nothing(user, "deal");

      const accountRes = await supabase
        .from("crm_accounts")
        .select("name")
        .eq("id", deal.account_id as string)
        .maybeSingle();

      return [
        `${deal.name}`,
        `Company: ${(accountRes.data as { name?: string } | null)?.name ?? "not readable"}`,
        line([
          `stage: ${deal.stage}`,
          money(deal.amount_cents as number, deal.currency as string),
          deal.mrr_cents ? `MRR ${money(deal.mrr_cents as number, deal.currency as string)}` : null,
          deal.expected_close_on ? `closes ${deal.expected_close_on}` : null,
        ]),
        `Attribution: ${deal.attribution_rule}${deal.attribution_note ? ` — ${deal.attribution_note}` : ""}`,
        deal.attribution_locked_at
          ? `Settled ${(deal.attribution_locked_at as string).slice(0, 10)}. The ledger reads the stored rule rather than deriving it again.`
          : "Not settled yet, so the rule is re-derived when anything changes.",
        deal.lost_reason ? `Lost because: ${deal.lost_reason}` : null,
        deal.notes ? `\nNotes:\n${deal.notes as string}` : null,
        `\nFigures here are a forecast. The commission ledger pays on cash that arrived and never reads them.`,
        `\nid: ${deal.id}`,
      ]
        .filter(Boolean)
        .join("\n");
    },
  },

  {
    name: "list_activities",
    description:
      "What has been logged recently: notes, calls, meetings, stage moves and finished follow ups. Narrow it to one person with contact_id.",
    permission: "crm.contacts.read.own",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Limit to one person." },
        limit: { type: "number" },
      },
    },
    async run({ supabase, user }, args) {
      const contactId = str(args.contact_id);

      let builder = supabase
        .from("crm_interactions")
        .select("kind, body, occurred_at, author, contact_id")
        .order("occurred_at", { ascending: false })
        .limit(limit(args.limit, 25));

      if (contactId) builder = builder.eq("contact_id", contactId);

      const result = await builder;
      if (result.error) return `That read failed: ${result.error.message}`;

      const found = rows<{
        kind: string;
        body: string | null;
        occurred_at: string;
        author: string | null;
      }>(result);

      if (found.length === 0) return nothing(user, "activity");

      return found
        .map(
          (entry) =>
            `${entry.occurred_at.slice(0, 16).replace("T", " ")} ${entry.kind}${entry.body ? `: ${entry.body}` : ""}${entry.author ? ` (${entry.author})` : ""}`
        )
        .join("\n");
    },
  },

  {
    name: "pipeline_summary",
    description:
      "The pipeline by stage: how many deals and what they are worth. Needs the reporting permission, which is held by owners, admins and a Head of Growth.",
    permission: "reports.read",
    inputSchema: { type: "object", properties: {} },
    async run({ supabase }) {
      const result = await supabase.rpc("crm_report_pipeline");
      if (result.error) {
        return "The pipeline rollup is not open to your login. It counts everybody's deals, so it is held at the level that already sees the whole board.";
      }

      const found = rows<{
        stage: string;
        deals: number;
        amount_cents: number;
        mrr_cents: number;
      }>(result);

      if (found.length === 0) return "No deals in the pipeline.";

      return found
        .map(
          (stage) =>
            `${stage.stage}: ${stage.deals} deal${stage.deals === 1 ? "" : "s"}, ${money(stage.amount_cents)}${stage.mrr_cents ? `, MRR ${money(stage.mrr_cents)}` : ""}`
        )
        .join("\n");
    },
  },

  {
    name: "search_brain",
    description:
      "Search what the company believes and how it writes: brand voice, the claims rule, business facts, market notes, settled decisions and how a proposal is written. Read this before drafting anything that goes out.",
    permission: "console.admin",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        collection: { type: "string", enum: BRAIN_COLLECTION_IDS },
        limit: { type: "number" },
      },
      required: ["query"],
    },
    async run({ supabase }, args) {
      const query = str(args.query);
      if (!query) return "Give me something to search for.";

      let builder = supabase
        .from("brain_docs")
        .select("collection, slug, title, summary, last_verified_on")
        .eq("archived", false)
        .or(
          `title.ilike.${like(query)},summary.ilike.${like(query)},body_md.ilike.${like(query)}`
        )
        .limit(limit(args.limit, 10));

      const collection = str(args.collection);
      if (collection && BRAIN_COLLECTION_IDS.includes(collection as never)) {
        builder = builder.eq("collection", collection);
      }

      const result = await builder;
      if (result.error) return `That search failed: ${result.error.message}`;

      const found = rows<{
        collection: string;
        slug: string;
        title: string;
        summary: string | null;
        last_verified_on: string | null;
      }>(result);

      if (found.length === 0) return "Nothing in the brain matched.";

      return found
        .map(
          (doc) =>
            `${doc.title} (${doc.collection}/${doc.slug})\n  ${doc.summary ?? "No summary."}\n  ${
              doc.last_verified_on
                ? `Last verified ${doc.last_verified_on}`
                : "Never verified, so treat it as a lead rather than a fact."
            }`
        )
        .join("\n\n");
    },
  },

  {
    name: "get_brain_doc",
    description:
      "Read one brain document in full. Takes the collection and slug returned by search_brain.",
    permission: "console.admin",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", enum: BRAIN_COLLECTION_IDS },
        slug: { type: "string" },
      },
      required: ["collection", "slug"],
    },
    async run({ supabase }, args) {
      const collection = str(args.collection);
      const slug = str(args.slug);
      if (!collection || !slug) return "Give me a collection and a slug.";

      const result = await supabase
        .from("brain_docs")
        .select("title, summary, body_md, last_verified_on, status")
        .eq("collection", collection)
        .eq("slug", slug)
        .eq("archived", false)
        .maybeSingle();

      const doc = result.data as
        | {
            title: string;
            summary: string | null;
            body_md: string;
            last_verified_on: string | null;
            status: string;
          }
        | null;

      if (result.error || !doc) return "There is no document at that address.";

      const age = doc.last_verified_on
        ? `Last verified ${doc.last_verified_on}.`
        : "Never verified. Treat what follows as a lead rather than a fact.";

      return `${doc.title}${doc.status === "draft" ? " (draft)" : ""}\n${age}\n\n${doc.body_md}`;
    },
  },

  /* ---------------------------------------------------------------- */
  /*  Writes                                                           */
  /* ---------------------------------------------------------------- */

  {
    name: "log_activity",
    description:
      "Record something that happened with a person: a note, a call, a meeting, a demo, or an email you sent. Written to their timeline under your name.",
    permission: "crm.contacts.write.own",
    writes: true,
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        /* The vocabulary is the one the database enforces in
           crm_interactions_kind_check. Only the kinds a person logs by
           hand are offered: the rest are written by the capture route and
           the mail webhook, and a chat window claiming an email was
           opened would be inventing evidence. */
        kind: {
          type: "string",
          enum: ["note", "call", "meeting", "demo", "email_sent"],
          description: "Defaults to note.",
        },
        body: { type: "string", description: "What was actually said." },
      },
      required: ["contact_id", "body"],
    },
    async run({ supabase, user }, args) {
      const contactId = str(args.contact_id);
      const body = str(args.body);
      const kind = str(args.kind, "note");

      if (!contactId || !body) return "I need a person and something to record.";
      if (!LOGGABLE_KINDS.includes(kind)) {
        return `That is not a kind of activity. Use one of: ${LOGGABLE_KINDS.join(", ")}.`;
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from("crm_interactions").insert({
        contact_id: contactId,
        kind,
        body,
        occurred_at: now,
        author: user.fullName || user.email,
        author_user_id: user.userId,
      });

      if (error) {
        return /row-level security/i.test(error.message)
          ? "That person is not yours to write to. An owner can reassign them."
          : `That did not save: ${error.message}`;
      }

      await supabase.from("crm_contacts").update({ last_activity_at: now }).eq("id", contactId);
      return `Recorded a ${kind} against that person, under ${user.fullName || user.email}.`;
    },
  },

  {
    name: "create_task",
    description: "Add a follow up against a person, with an optional due date as yyyy-mm-dd.",
    permission: "crm.contacts.write.own",
    writes: true,
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string" },
        title: { type: "string" },
        due_date: { type: "string", description: "yyyy-mm-dd. Optional." },
      },
      required: ["contact_id", "title"],
    },
    async run({ supabase, user }, args) {
      const contactId = str(args.contact_id);
      const title = str(args.title);
      const due = str(args.due_date);

      if (!contactId || !title) return "I need a person and a title.";
      if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        return "That due date is not a date. Use yyyy-mm-dd.";
      }

      const dueIso = due ? new Date(`${due}T09:00:00Z`).toISOString() : null;

      const { error } = await supabase.from("crm_tasks").insert({
        contact_id: contactId,
        title,
        due_at: dueIso,
        status: "open",
        priority: "normal",
        assigned_to: user.userId,
        created_by: user.userId,
      });

      if (error) {
        return /row-level security/i.test(error.message)
          ? "That person is not yours to write to."
          : `That did not save: ${error.message}`;
      }

      return `Added "${title}"${due ? ` for ${due}` : ""}, assigned to you.`;
    },
  },

  {
    name: "update_deal_stage",
    description:
      "Move a deal to a stage. Won and lost are refused here on purpose: closing a deal decides money and is done in the console, where it asks for a close date and cannot be undone.",
    permission: "crm.deals.manage",
    writes: true,
    inputSchema: {
      type: "object",
      properties: {
        deal_id: { type: "string" },
        stage: { type: "string", enum: ["opportunity", "proposal", "negotiation"] },
      },
      required: ["deal_id", "stage"],
    },
    async run({ supabase, user }, args) {
      const dealId = str(args.deal_id);
      const stage = str(args.stage) as DealStage;

      if (!dealId || !stage) return "I need a deal and a stage.";

      /* The terminal stages are not reachable from here. A won deal locks
         its attribution and starts a commission clock, and the console
         makes that a two step for a reason. A sentence in a chat is not
         the place to spend that. */
      if (stage === "won" || stage === "lost") {
        return "Closing a deal is done in the console. It locks the attribution rule and starts a commission clock, so it asks for a close date and cannot be undone.";
      }
      if (!DEAL_STAGES.some((entry) => entry.id === stage)) return "That is not a stage.";

      const currentRes = await supabase
        .from("crm_deals")
        .select("stage, name")
        .eq("id", dealId)
        .maybeSingle();

      const current = currentRes.data as { stage: string; name: string } | null;
      if (!current) return nothing(user, "deal");
      if (current.stage === "won" || current.stage === "lost") {
        return `That deal is already ${current.stage}. A settled deal is history.`;
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from("crm_deals").update({ stage }).eq("id", dealId);

      if (error) {
        return /row-level security/i.test(error.message)
          ? "That deal is not yours to change."
          : `That did not save: ${error.message}`;
      }

      /* The same two records the console writes: one the reports count,
         one a person reads. */
      await Promise.all([
        supabase
          .from("crm_stage_changes")
          .insert({ deal_id: dealId, from_stage: current.stage, to_stage: stage }),
        supabase.from("crm_interactions").insert({
          deal_id: dealId,
          kind: "stage_change",
          body: `${current.stage} to ${stage}`,
          meta: { from: current.stage, to: stage, via: "mcp" },
          occurred_at: now,
          author: user.fullName || user.email,
          author_user_id: user.userId,
        }),
      ]);

      return `Moved "${current.name}" from ${current.stage} to ${stage}.`;
    },
  },
];

export function toolByName(name: string): McpTool | undefined {
  return MCP_TOOLS.find((tool) => tool.name === name);
}

/** The tools this person may actually call, in the protocol's shape. */
export function visibleTools(user: ConsoleUser) {
  return MCP_TOOLS.filter((tool) => can(user, tool.permission)).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
