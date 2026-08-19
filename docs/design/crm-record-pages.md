# CRM record pages

Build spec for `/admin/dashboard/people/[id]`, `/admin/dashboard/companies/[id]` and
`/admin/dashboard/deals/[id]`. These three pages replace `ContactDrawer.tsx`,
`AccountDrawer.tsx` and `DealDrawer.tsx`.

A drawer is 460px of a 1440px screen with a backdrop over the rest, and it has no address, so a
record cannot be linked, bookmarked, opened in a second tab or sent to somebody in Slack. Every
field, every list and every action below already exists in one of the three drawers. This document
moves them onto a page and says exactly where each one lands.

Read [DESIGN.md](../../DESIGN.md) first. Everything here is subordinate to it.

---

## 0. What is being built

| Route | Reads | Permission to enter | Permission to change |
|---|---|---|---|
| `/admin/dashboard/people/[id]` | `crm_contacts`, `crm_interactions`, `crm_tasks`, `crm_deals`, `crm_accounts`, `crm_events`, `crm_sequences` | `crm.contacts.read.own` | `crm.contacts.write.own` |
| `/admin/dashboard/companies/[id]` | `crm_accounts`, `crm_contacts`, `crm_deals` | `crm.accounts.manage` | `crm.accounts.manage` |
| `/admin/dashboard/deals/[id]` | `crm_deals`, `crm_accounts`, `crm_contacts` | `crm.deals.manage` | `crm.deals.manage` |

Each is a server component that guards, reads, and hands typed rows to one client form component.
Follow the sibling list pages: `export const dynamic = "force-dynamic"`, `getConsoleUser()`, `can()`,
and every query result through `rows()` / `readWarning()` from `@/lib/supabase/rows`. These routes sit
behind auth, so no `metadata`, no canonical, no sitemap entry.

Params and search params are promises in this Next version, matching the siblings:

```ts
export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
```

The list screens stop opening drawers. In `DataTable`, drop the `onOpen` prop at the call site and
render the `fixed` name column as a `<Link href={`/admin/dashboard/people/${row.id}`}>`, so a
record survives a middle click and a ⌘-click.

---

## 1. The record page skeleton

```
┌─ scroller ─ flex-1 min-w-0 overflow-y-auto ──────────────────────────────┐
│ ┌─ wrapper ─ px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16 ┐
│ │                                                                        │
│ │  ‹ People / Nadia Reyes                     ← breadcrumb, one line     │
│ │                                                                        │
│ │  Nadia Reyes                                 [ Add note ]  ← primary   │
│ │  Head of Post at Helix Post                  ← fact line               │
│ │  ◦Qualified ◦Sales qualified ◦Conference     ← chip row                │
│ │  [ Email ] [ Call ] [ LinkedIn ] [ vCard ]   ← quick actions           │
│ │                                                                        │
│ │  ( Overview )( Activity 24 )( Deals 2 )      ← ObjectTabs, ?tab= in URL│
│ │                                                                        │
│ │ ┌──────────────────────────┬─────────────────────────┐                 │
│ │ │ LEFT  7fr                │ RIGHT  5fr              │                 │
│ │ │ fields, grouped by       │ history and related     │                 │
│ │ │ Overline sections        │ records, one row recipe │                 │
│ │ │                          │                         │                 │
│ │ └──────────────────────────┴─────────────────────────┘                 │
│ │                                                                        │
│ │ ▔▔▔ sticky save bar, only when the form is dirty ▔▔▔                   │
│ └────────────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Wrapper, scroller, measure

`AdminShell`'s `<main>` is `md:overflow-hidden`, so the page supplies its own scroller.

```tsx
<div className="flex-1 min-w-0 overflow-y-auto">
  <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
    {/* breadcrumb, header, tabs, body, save bar */}
  </div>
</div>
```

**Pick the deals/companies convention (`px-4 sm:px-6 lg:px-10 py-8 lg:py-12` + `max-w-6xl mx-auto`)
and not the people convention (`p-4 sm:p-6 lg:p-8` + `max-w-[100rem]`), because `max-w-[100rem]` is
1600px and exists so a master spreadsheet can hold twelve columns, whereas a record page is a
reading surface whose left column is a form: past roughly 1150px a two-up field grid gives every
input a line length nobody wants to fill in.**

### 1.2 Breadcrumb

There is no breadcrumb concept in this console today. This invents one, and it is capped at one line
forever: parent object, separator, this record. Never a third level, never the tab name.

```tsx
<nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
  <Link
    href="/admin/dashboard/people"
    className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
  >
    <ChevronLeft className="w-3.5 h-3.5" />
    People
  </Link>
  <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">/</span>
  <span className="text-[11px] text-zinc-500 truncate">{contact.full_name}</span>
</nav>
```

The parent link points at the bare list route with no `?tab=`, so it is one address rather than a
guess at where somebody came from. The record name in the trail is text and never a link, because a
link to the page you are on is a link that does nothing.

### 1.3 ObjectHeader

Use `ObjectHeader` from `src/components/admin/ObjectTabs.tsx` exactly as exported.

```tsx
<ObjectHeader title={contact.full_name} action={<PrimaryAction />}>
  <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
    {[contact.job_title, contact.company].filter(Boolean).join(" at ") || "No company noted"}
  </p>
  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
    {/* chips */}
  </div>
</ObjectHeader>
```

**`count` and `countLabel` are never used on a record page.** A record counts nothing that belongs
beside its own name, and `ObjectTab.badge` already exists for exactly this: the People tab on a
company carries `badge={people.length}`, the Activity tab on a person carries the interaction count.
Counts live on the tab that opens them.

**The fact line** is one sentence of at most two facts, and it is the identity fact rather than a
state fact, because state is already in the chips below it.

| Object | Fact line |
|---|---|
| Person | `job_title` at `company`, falling back to `"No company noted"` |
| Company | `domain`, falling back to `"No web address on file"` |
| Deal | account name, then `expected_close_on` as `Closes 3 Sep 2026` when set |

**The chip row** carries the state chips the drawers already draw, in this order, and stops:

| Object | Chips |
|---|---|
| Person | stage (`stageSpec(...).badge`), `<LifecycleChip>`, `<SourceChips limit={4}>`, event name when set, `Archived` when archived |
| Company | lifecycle, `Pays no commission` when comped or company managed or carved out, `Archived` when archived |
| Deal | stage (`DEAL_STAGES` badge), attribution rule (`attributionSpec(...).badge`), amount when non-zero |

**The primary action** is one `.btn-primary`, plus at most one `.btn-glass` beside it. Everything
else moves into the body.

| Object | Primary | Beside it |
|---|---|---|
| Person | `Add note`, navigating to `?tab=activity` and focusing the note composer | none |
| Company | `New deal`, linking to `/admin/dashboard/deals?new=1&account=<id>` | none |
| Deal, open | `Mark won` | `Mark lost` |
| Deal, won or lost | none | none |

Both deal buttons open the confirmation the drawer already has, rendered as the first block of the
left column rather than as a popover: close date for a won deal, reason for a lost one. Archive and
restore never appear in the header. They live at the foot of the Overview left column.

Every header control gets `min-h-[44px] sm:min-h-[36px]`.

### 1.4 Tab strip

```tsx
<ObjectTabs
  tabs={visible}
  current={tab}
  basePath={`/admin/dashboard/people/${contact.id}`}
  className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0"
/>
```

`ObjectTabs` appends `?tab=`, so a record tab is `/admin/dashboard/people/<id>?tab=activity`:
linkable, back-button safe, and a legal redirect target. Resolve with `resolveTab(TABS, params.tab,
"overview")`. A tab whose permission the reader does not hold is filtered out of the array before
rendering, matching the list pages.

### 1.5 Two-column body

```tsx
<div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
  <div className="min-w-0 space-y-7">{/* fields */}</div>
  <div className="min-w-0 space-y-5">{/* history and related records */}</div>
</div>
```

58/42 at `max-w-6xl` gives roughly 650px on the left, which holds a two-up field grid, and roughly
465px on the right, which holds a row with a right-aligned figure. Neither column is sticky: the
right column is a timeline that is longer than the viewport, and a sticky column that scrolls
internally is two scrollbars in one page.

**A tab that has no field column drops the grid and runs one column** inside the same wrapper. A
pure list tab (a company's People, a company's Deals, a person's Deals) keeps `max-w-6xl`. A tab that
is one short form (a person's Sequences) uses `max-w-2xl`, so a lone select is not 1150px wide.

---

## 2. The field column

### 2.1 A section

```tsx
<section aria-label="Details" className="space-y-3.5">
  <Overline as="h2" className="pb-1 border-b border-white/5">Details</Overline>
  {/* fields */}
</section>
```

`Overline` is imported from `src/components/admin/Overline.tsx`. Do not write a local `SectionLabel`.
All three drawers declared their own copy of that helper, which is how a label recipe drifts. Note
that `Overline` currently resolves to `text-gray-400`: use the component and never copy that string
into a new class list, so the day the recipe is corrected it is corrected in one file.

Sections are separated by the column's own `space-y-7` and by the hairline under each heading. Do not
put a card, border or panel around a field group. A page of bordered boxes reads as a settings screen
rather than as one record.

### 2.2 A field

```tsx
<div>
  <FieldLabel htmlFor="person-email">Email</FieldLabel>
  <input
    id="person-email"
    type="email"
    inputMode="email"
    value={fields.email}
    onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
    className="admin-input h-11 sm:h-9 py-0"
  />
</div>
```

`FieldLabel` is the named export from the same file, and it requires `htmlFor`. This replaces the
wrapping `<label>` the drawers used. The ContactDrawer already documents why the wrapper is wrong:
a label around several controls hands every stray tap to the first input.

- Text, email, phone, url, date, datetime-local, select: `admin-input h-11 sm:h-9 py-0`.
- Select adds `cursor-pointer`.
- Textarea: `admin-input resize-y leading-relaxed` with `rows={4}`.
- Money and counts add `tabular-nums`.
- Helper text under a field: `<p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">`.
  Keep the drawers' existing sentences verbatim. They are policy, not decoration.

### 2.3 A group of fields

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
  {/* two-up fields */}
</div>
```

A field that holds a sentence rather than a value (Name, Notes, Where we met, Carve out) gets
`sm:col-span-2` or sits outside the grid. Nothing wider than two columns at any breakpoint.

### 2.4 The save affordance

Three Save buttons scattered down one page is three chances to lose the change in the section nobody
pressed. Replace all of them with one dirty-state bar.

**Instant commit, no bar.** Anything that is one column and one gesture writes on change, exactly as
the drawers already do: person stage, lifecycle, priority, tags, archive and restore; deal stage
(the segmented control); company archive and restore. A failed instant write says so in the toast
the screen already carries.

**Everything typed collects into one form and one bar.** The bar exists only while
`dirtyCount > 0`.

```tsx
{dirtyCount > 0 && (
  <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
    <span className="text-[11px] text-zinc-400 tabular-nums min-w-0">
      {dirtyCount} unsaved {dirtyCount === 1 ? "change" : "changes"}
      {result && <span className="text-zinc-300"> · {result}</span>}
    </span>
    <div className="flex items-center gap-2 ml-auto shrink-0">
      <button type="button" onClick={discard} className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full">
        Discard
      </button>
      <button type="button" onClick={save} disabled={saving} className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Saving" : "Save"}
      </button>
    </div>
  </div>
)}
```

The bar is a sibling of the grid and the last child of the wrapper, so `sticky bottom-0` pins it to
the bottom of the scroller. The wrapper keeps `pb-16` so it has somewhere to land at the end of the
scroll.

- `dirtyCount` is the number of fields whose value differs from the server row, so the reader can see
  they changed two things and not one.
- `Discard` restores from the server row. It never reloads the page.
- The result of the save, success or failure, is stated inside the bar. Delete the grey message box
  the account and deal drawers render at the top of the body: a status line 400px above the button
  that produced it is a status line nobody reads.
- ⌘S and Ctrl+S save while the bar is showing. `preventDefault` only when it is.
- No modal on navigate-away. The bar never scrolls off, so nothing is hidden to warn about.

---

## 3. The right column

One list container, one row recipe, three uses. This is the recipe already used by
`activities/TimelinePanel.tsx`, so the console has one drawing of a list of things that happened.

### 3.1 Container

```tsx
<section aria-label="Recent activity" className="space-y-2.5">
  <div className="flex items-baseline justify-between gap-3">
    <Overline as="h2">Recent activity</Overline>
    <Link href={`/admin/dashboard/people/${id}?tab=activity`} className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0">
      See all
    </Link>
  </div>
  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
    {/* rows */}
  </ul>
</section>
```

The "See all" link appears only when the section is showing a slice. A section showing everything has
nowhere to go.

### 3.2 The row

```tsx
<li className="flex items-start gap-3 px-4 py-3">
  {/* 1. the glyph, or the one control this row carries */}
  <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
    <Icon className="w-3.5 h-3.5" />
  </span>

  {/* 2. what it is */}
  <span className="min-w-0 flex-1">
    <span className="flex items-baseline gap-2 flex-wrap">
      <span className="text-xs text-white break-words">{title}</span>
      {chip}
    </span>
    {body && (
      <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
        {body}
      </span>
    )}
  </span>

  {/* 3. when, or how much */}
  <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">{trailing}</span>
</li>
```

Only slot 2's title is ever a link. The row itself is never a click target, because a row that
carries a checkbox or a select cannot also be a navigation. `DataTable` already encodes this rule.

### 3.3 The three uses

| Use | Slot 1 | Title | Body | Trailing |
|---|---|---|---|---|
| **Timeline entry** | kind glyph | `INTERACTION_LABELS[kind]` | `entry.body`, then `entry.author` on its own `text-[10px] text-zinc-400` line | `relativeTime(occurred_at)` with `title={formatDateTime(occurred_at)}` |
| **Task row** | the complete-it button, `w-11 h-11 sm:w-7 sm:h-7 -m-1.5 sm:m-0` circle, `border border-white/15`, `Check` glyph, `Loader2` while busy | `task.title` | none | `Due 3 Sep`, or `Overdue 3 Sep` in `text-amber-400 font-medium` |
| **Related record** | object glyph: `Contact`, `Building2`, `Handshake` | `<Link>` to that record's page | the one supporting fact: job title and email for a person, owner name for a deal | the figure: `<Money cents={...} currency={...} />` plus the stage chip |

A done task keeps the same row with `opacity-60`, the title `line-through text-zinc-400`, an
`emerald-400` `Check` in slot 1 in place of the button, and `Done 3 Sep` trailing. Done tasks sit
inside a `<details>` whose `<summary>` reads `Done (4)` and which starts closed.

Lateness is amber and never red. There is no red on this console.

### 3.4 Composers

A composer (add note, add task, enrol in a sequence) sits above the list it fills, in one block:

```tsx
<div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
```

Keep the drawers' placeholder copy verbatim, including
`"What was actually said. Write it before you get to the next stand."`

---

## 4. Per-object specifics

Everything below exists in one of the three drawers today. Nothing here is a new field.

### 4.1 Person, `/admin/dashboard/people/[id]`

Tabs. Sequences is dropped from the array unless the reader holds `crm.sequences.manage`.

| id | Label | Icon | Badge |
|---|---|---|---|
| `overview` | Overview | `User` | none |
| `activity` | Activity | `Phone` | interaction count |
| `deals` | Deals | `Handshake` | count of deals where `primary_contact_id` is this person |
| `sequences` | Sequences | `Route` | none |

**Overview**, two columns.

*Left:*

1. **Pipeline**: Stage (`CRM_STAGES` select), Lifecycle (`LIFECYCLE_STAGES` select), Priority
   (`CRM_PRIORITIES` select) in a two-up grid. Then Tags: the chip list, the `investor, hiring,
   needs-demo` input and the Add button, outside any wrapping label. All four commit instantly.
2. **Details**: Name (`sm:col-span-2`), then two-up: Email, Phone, Company, Job title, Website,
   LinkedIn, City, Country. Then Company record (the `crm_accounts` select, `"No account"` first),
   Event (the `crm_events` select, `"No event"` first), Where we met, Next follow up
   (`datetime-local`). Then Notes as a textarea, `sm:col-span-2`. All of these go through the save bar.
3. **Record**: the closing block. The `Met {formatDateTime(met_at)}` line with the
   `", typed with no signal and synced later"` suffix when `captured_offline`, the sentence
   `"Archiving takes someone off the board and keeps every note and follow up. Nothing in here is
   ever deleted."`, and the Archive or Restore button (`.btn-danger` to archive, `.btn-glass` to
   restore).

*Right:*

1. **How they got here**: `<SourceChips>` over `contact.sources`, the event name when set, and
   `met_context` as a quiet line. No panel when all three are absent.
2. **Open follow ups**: up to five task rows plus the task composer, with "See all" into Activity.
3. **Recent activity**: the last eight timeline rows, with "See all" into Activity.

**Activity**, two columns.

- *Left:* the note composer, then the full timeline, newest first, capped at 200 as the drawer caps it.
- *Right:* the task composer, then open follow ups, then the closed `<details>` of done ones.

**Deals**, one column. Related-record rows for every deal whose `primary_contact_id` is this person,
each linking to `/admin/dashboard/deals/<id>`. Above the list, one related-record row for the company
this person rolls up to, linking to `/admin/dashboard/companies/<id>`.

**Sequences**, one column at `max-w-2xl`. The sequence select and the Enrol button, then the sentence
`"Every step lands in the follow up queue at once, dated from today. Nothing is sent until somebody
opens the draft and presses send."` The sequence list is read on the server with the record.

### 4.2 Company, `/admin/dashboard/companies/[id]`

| id | Label | Icon | Badge |
|---|---|---|---|
| `overview` | Overview | `Building2` | none |
| `people` | People | `Contact` | people count |
| `deals` | Deals | `Handshake` | deal count |

**Overview**, two columns.

*Left:*

1. **Company**: Name, Web address (with the sentence `"Stored lowercased, and it is what stops the
   same company being added twice. Company names get typed three different ways, a domain is one
   string."`), then two-up: Industry, Size, City, Country, Website, Lifecycle
   (`ACCOUNT_LIFECYCLES`). Then Notes.
2. **First contact**: the date field and its sentence about a registration filed after this date
   being refused.
3. **Commission exclusions**: the Comped switch, the Company managed switch, the Carve out field and
   its sentence. When any is set, a `<Panel tone="attention">` reading `"Nothing on this account pays
   commission while any of these is set."` This is the only amber on the page and it is spent
   correctly: an ignored switch here means nobody gets paid.
4. **Record**: Archive or Restore.

*Right:*

1. **Credit**: `Sourced by` and `Owner` as two definition lines. Keep the drawer's fallbacks:
   `"Nobody. It walked in."` and `"Unassigned"`.
2. **People**: up to five related-record rows, "See all" into the People tab.
3. **Deals**: up to five related-record rows, "See all" into the Deals tab.

**People**, one column. Every person on this account as a related-record row: name links to the
person page, body is `[job_title, email]` joined with ` · `, falling back to
`"No job title or email"`.

**Deals**, one column. Every deal on this account: name links to the deal page, body is the owner
name, trailing is the amount and the stage chip.

### 4.3 Deal, `/admin/dashboard/deals/[id]`

| id | Label | Icon | Badge |
|---|---|---|---|
| `overview` | Overview | `Handshake` | none |
| `attribution` | Attribution | `Stamp` | none |

**Overview**, two columns.

*Left:*

1. **Close confirmation**: drawn only while the header's Mark won or Mark lost is armed. Won: the
   paragraph about the ledger keying a collection month off the date, the Close date field capped at
   today, and `Record the close`. Lost: the `Why it was lost` field and `Record it as lost`. This is
   a two-step for an act the database will not let you take back, which is why it is not a menu item.
2. **Stage**: the segmented control over the non-terminal `DEAL_STAGES`, committing instantly. Below
   it, the `"Closed 3 Sep 2026 by Ana Duarte"` line on a won deal, or the `lost_reason` on a lost one.
3. **Deal**: Name, Account (select), Primary contact (select, contacts at the chosen account first).
   Then two-up: Motion, Expected close, Amount, MRR, Billing period, Currency, Plan tier, Seats. Then
   the sentence `"Amounts here are a forecast. The commission ledger pays on cash that arrived and
   never reads these figures."` Then Notes.

*Right:*

1. **Company**: one related-record row linking to `/admin/dashboard/companies/<account_id>`.
2. **Primary contact**: one related-record row linking to the person page, or an `EmptyPanel`
   reading `"Nobody named yet"` when `primary_contact_id` is null.

**Attribution**, one column at `max-w-3xl`.

`<AttributionVerdict>` at full width with the Recheck button in its `action` slot, followed by the
Promo code and Tracked source fields and the sentence `"These two are the evidence the rules read.
Save the deal after changing them, then recheck."` Then **Credit**: `Sourced by` with its hint
`"Set once when the deal was created. Only an owner can move it."`, `Owner`, and `Closed by`.

Credit lives here and not on Overview because attribution and credit are the same question asked
twice, and answering it in two places invites the two answers to disagree. Do not render a second,
cut-down attribution panel on Overview: the header chip already carries the rule.

---

## 5. States

### 5.1 Loading

One `loading.tsx` per segment, beside its `page.tsx`, following
`src/app/admin/dashboard/tasks/loading.tsx`: same wrapper classes, same rhythm, no spinner, nothing
that moves except the pulse.

```tsx
export default function PersonLoading() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
        <div className="mb-4 h-4 w-40 rounded bg-white/[0.04] animate-pulse" />
        <div className="mb-2.5 h-9 w-72 rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="mb-5 h-3 w-56 rounded bg-white/[0.04] animate-pulse" />
        <div className="mb-6 flex gap-2 border-b border-white/5 pb-3">
          {[0, 1, 2].map((pill) => (
            <div key={pill} className="h-11 sm:h-9 w-28 rounded-full bg-white/[0.03] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
          <div className="min-w-0 space-y-7">
            {[0, 1].map((section) => (
              <div key={section} className="space-y-3.5">
                <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {[0, 1, 2, 3].map((field) => (
                    <div key={field}>
                      <div className="mb-1.5 h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-11 sm:h-9 rounded-lg bg-white/[0.02] border border-white/8" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <PanelSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

`PanelSkeleton` is the named export from `src/components/admin/Panel.tsx`. `StatRowSkeleton` is not
used: a record page has no stat strip, because a single record has no figures to summarise.

### 5.2 Empty

Three different emptinesses, three different answers, and none of them is a bare zero.

1. **A list on a tab is empty.** `<EmptyPanel>` from `Panel.tsx`, with the title, one sentence saying
   what would appear here, and where there is one, the action that puts something in it. Reuse the
   drawers' copy:

   | List | Title | Sentence |
   |---|---|---|
   | Company's people | `Nobody here yet` | `Set this company on a person's record and they roll up into this list.` |
   | Company's deals | `No deal here yet` | `Deals created against this company appear here.` |
   | Follow ups | `Nothing scheduled` | `The one you write on the night of the event is the one that gets done.` |
   | Timeline | `Nothing recorded yet` | `Notes, stage moves and finished follow ups all land here.` |
   | Person's deals | `No deal names this person` | `A deal hangs off a company. Set this person as its primary contact and it appears here.` |

2. **A field has no value.** The input is empty with its placeholder. Never the word `None`, never a
   dash, never a zero in a money field. `toAmountInput` already returns `""` rather than `"0"`, and
   that behaviour is deliberate.

3. **The id does not resolve to a row and the reader holds the read permission.** This is genuine
   absence rather than refusal only when the reader can see every row of that table
   (`crm.contacts.read.all`, or `crm.accounts.manage` / `crm.deals.manage`). Call `notFound()` and add
   a `not-found.tsx` in the segment: the breadcrumb, an `EmptyPanel` titled `This record is gone`, and
   the sentence `Nothing on this console deletes a record, so this address was probably mistyped.`
   plus a `.btn-glass` back to the list.

### 5.3 Refused

The console's rule: a refused thing reads as a closed door. Never a broken page, never an empty form,
never a screen of zeros.

**Case A: the route is not open to this role at all.** The list pages redirect to
`/admin/dashboard`. A record page must not, because a record page is what somebody was sent a link
to, and a silent bounce to the overview reads as a bug. Render the page shell with the door closed:

```tsx
if (!can(user, "crm.deals.manage")) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Deals</span>
        </nav>
        <ObjectHeader title="Deal" />
        <Panel title="Deals are not open to your role">
          A deal carries an amount and an attribution rule, so reading one is a permission of its own.
          Ask an owner if you need it.
        </Panel>
      </div>
    </div>
  );
}
```

The title says the **kind** of thing and never the record's name, because the name is part of what
they may not read. The breadcrumb parent is plain text here rather than a link, since the list is
refused too. This matches the copy pattern already on the console: `"Sequences are not open to your
role"`, `"Registrations are not open to your role"`.

**Case B: the reader holds the permission but row level security returns nothing.** A growth partner
opening somebody else's contact gets `data: null` with no error, which is indistinguishable from a
missing row. Read the record before rendering anything, and when it is absent and the reader is
scoped (`crm.contacts.read.own` without `crm.contacts.read.all`), say so honestly:

> **This record is not on your list**
> It exists, or it does not, and either way it is outside what your login can read. Ask an owner if
> you should have it.

Draw this with `<Panel>` in the same shell as Case A. **Never render the record shell with empty
fields**, because a form full of blanks says the record is empty when what happened is that it was
refused, and somebody will type into it.

**Case C: the reader can read but not write.** `crm.contacts.read.own` without
`crm.contacts.write.own`, or any reader on the deals page without `crm.deals.manage`.

- Every input and select gets `readOnly` (or `disabled` for selects) plus
  `disabled:opacity-60 disabled:cursor-not-allowed`.
- The save bar never renders. `dirtyCount` cannot rise, because nothing can change.
- The instant-commit controls are disabled too, along with the composers, Archive, Enrol, Mark won
  and Mark lost.
- One line at the top of the left column, not a banner:
  `<p className="text-[11px] text-zinc-400 leading-relaxed">You can read this record. Ask an owner if
  you need to change it.</p>`
- **Do not hide the fields.** Hiding a value somebody is allowed to read is a different refusal from
  the one that applies, and it is the one that makes a product feel broken.

**Case D: a related list is refused while the record reads fine.** A person's deals when the reader
lacks `crm.deals.manage`. Drop the tab from the `TABS` array entirely. A tab that opens onto a
closed door is furniture, and a menu showing doors that do not open also tells somebody the shape of
what everybody else can do.

---

## 6. Mobile

Non-negotiable, per DESIGN.md. Verify at 320, 375, 390, 768 and 1024.

### 6.1 Stacking at 375px

Top to bottom, and this is the DOM order at every width:

1. Breadcrumb, one line: chevron, parent label, `/`, truncated record name.
2. Title, wrapping freely (`break-words` is already on the header's container via `min-w-0`).
3. Fact line.
4. Chip row, wrapping.
5. Quick actions row, wrapping, on the person page only.
6. Primary action, wrapped onto its own line by `ObjectHeader`'s `flex-wrap`.
7. Tab strip, scrolling horizontally.
8. Left column in full: fields, one per row.
9. Right column in full: composers, then history, then related records.
10. Save bar, pinned to the bottom of the viewport whenever the form is dirty.

**Do not reorder the columns with `order-*` at any breakpoint.** Moving the history above the fields
on a phone would put the DOM order and the reading order out of step for a screen reader. The mobile
shortcut to history is the tab strip, which is already at the top of the screen: one tap to Activity.

### 6.2 What collapses

| At | What |
|---|---|
| `< lg` (1024) | The two-column grid becomes one column. `gap-6` throughout. |
| `< sm` (640) | Every `sm:grid-cols-2` field group becomes one column. Composers stack their input, date and button vertically. |
| `< sm` | Every control grows from 36px to 44px: `h-11 sm:h-9` on inputs and selects, `min-h-[44px] sm:min-h-[36px]` on buttons. |
| All widths | Done follow ups stay inside a closed `<details>`. |
| All widths | A related-record row wraps its trailing figure under the title rather than truncating it. `flex-wrap` on the row's inner span, never `whitespace-nowrap` on an amount. |

The save bar keeps `pb-[max(0.75rem,env(safe-area-inset-bottom))]` so it clears the home indicator.

### 6.3 The tab strip on mobile

`ObjectTabs` is already `flex gap-2 overflow-x-auto` with `shrink-0` pills, so it scrolls
horizontally and never overflows the page. Two changes:

1. **`ObjectTabs` must change `h-9` to `h-11 sm:h-9` on its `<Link>`.** The pills are 36px today,
   which fails the 44px rule. This is one line in
   `src/components/admin/ObjectTabs.tsx` and it fixes every object screen on the console at once. Do
   not work around it at the call site: the component owns the pill.
2. Pass `className="-mx-4 px-4 sm:mx-0 sm:px-0"` so the strip bleeds to the screen edge. A pill cut
   by the edge of the screen is the scroll hint. No `md:hidden` "Swipe to view" caption is needed
   here, because the cut pill is self-evident in a way a cut table column is not.

### 6.4 Touch targets, exhaustively

| Control | Class |
|---|---|
| Breadcrumb back link | `h-11 sm:h-9 -ml-2 px-2` |
| Tab pill | `h-11 sm:h-9` (inside `ObjectTabs`) |
| Input, select, date | `h-11 sm:h-9 py-0` |
| Any button | `min-h-[44px] sm:min-h-[36px]` |
| Task complete circle | `w-11 h-11 sm:w-7 sm:h-7 -m-1.5 sm:m-0` |
| Tag remove | `w-11 h-11 sm:w-6 sm:h-6 -my-2 sm:my-0 -mr-1.5 sm:mr-0`, with `overflow-visible` on the chip so the hit area may exceed it |
| `<details>` summary for done tasks | `min-h-[44px] flex items-center` |
| Quick action link | `min-h-[44px] sm:min-h-[36px]` |

### 6.5 No horizontal overflow at 320px

- Wrapper is `px-4`. Grid is `grid-cols-1`. Both columns carry `min-w-0`. Every row's text span
  carries `min-w-0`.
- Long values use `break-words`, timeline bodies add `whitespace-pre-wrap`.
- The only horizontally scrolling region on these pages is the tab strip.
- No fixed pixel widths anywhere. The drawers' `sm:max-w-[460px]` and `sm:max-w-[480px]` do not come
  across.

---

## 7. What to delete

Each of these is in the drawers today and must not survive the move.

1. **The overlay, the backdrop and the slide-in.** `fixed inset-0 z-[60]`, `bg-black/70
   backdrop-blur-sm`, and the `AnimatePresence` + `motion.div` with `x: 40`. A page is not on top of
   anything, so there is nothing to dim and nothing to slide over.
2. **`document.body.style.overflow = "hidden"` and the Escape key handler.** A page has nothing to
   close, and swallowing Escape on a page full of selects breaks the native picker.
3. **The X button in the header.** The breadcrumb replaces it, and it says where back actually goes
   instead of leaving you to guess.
4. **The per-section Save button** (`Save details`, `Save account`, `Save deal`). One dirty-state bar
   replaces all of them: three save buttons on one page is three chances to lose the change in the
   section nobody pressed.
5. **The local `SectionLabel` and `Field` helpers**, declared identically in all three drawers.
   `Overline` and `FieldLabel` already exist, and three private copies of a label recipe is exactly
   how this console drifted the first time.
6. **The wrapping `<label>` around a field.** `FieldLabel htmlFor` plus an `id` on the control. The
   ContactDrawer already documents the bug: a label wrapping several controls hands every stray tap
   to the first input.
7. **The grey `message` box at the top of the body** in `AccountDrawer` and `DealDrawer`. The save bar
   states its own result: a status line hundreds of pixels above the button that caused it is a
   status line nobody sees.
8. **The dot-and-rail timeline connector.** It exists because the drawer had no list chrome. The page
   uses the bordered `divide-y` list that `/admin/dashboard/activities` already uses, so the console
   has one drawing of a timeline rather than two.
9. **`text-zinc-700` on the disabled quick action chip.** It is below the ghost tier and reads as a
   rendering fault. On a page an unavailable action is simply not drawn, and the missing email or
   phone is visible in the field beside it.
10. **Creating a record inside the detail surface.** `account === null` and `deal === null` opening a
    blank drawer has no meaning at an address that requires an id. Creation stays on the list screen.
11. **The two browser-side `useEffect` reads in `ContactDrawer`** for accounts and sequences. A server
    component reads them once alongside the record, already scoped by row level security, so the page
    stops making two extra round trips after it has already painted.
12. **The `onChanged` / `onSaved` callback pair and the parent's copy of the row.** The page owns its
    own data and calls `router.refresh()`, so there is no second copy of the record to keep in step
    with the first.
13. **`sm:max-w-[460px]` and `sm:max-w-[480px]`, and `h-9` as the only control height.** The page owns
    its measure, and a 36px control fails the 44px rule on every phone.

---

## 8. Checklist before opening the PR

- [ ] `ObjectTabs` pill is `h-11 sm:h-9`.
- [ ] No `neutral-*` anywhere. No inline `style={{ fontFamily }}`. No `Sparkles`.
- [ ] Every button is one of `.btn-primary`, `.btn-glass`, `.btn-ghost`, `.btn-danger`, and is
      `rounded-full`.
- [ ] No arbitrary text size other than `text-[10px]` and `text-[9px]`, plus the console's existing
      `text-[11px]`.
- [ ] Each of the three routes has a `loading.tsx` and a `not-found.tsx`.
- [ ] Refused reads render a closed door, never an empty form and never a zero.
- [ ] 320px: no horizontal scroll on the page body.
- [ ] The three drawer files are deleted, not left unimported.
- [ ] `npm run build` passes.
