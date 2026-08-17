/**
 * Who may do what.
 *
 * One catalog, read by three things that must never disagree: the
 * middleware that guards a URL, the shell that decides which navigation
 * items exist, and the server actions that refuse work. When those three
 * hold three copies of the rule, the copy that drifts is always the one
 * doing the enforcing, and the symptom is a hidden page that is still
 * reachable by typing its address.
 *
 * This file is the interface half. The database has its own copy of the
 * rule in row level security, and that copy is the one that actually
 * protects anything — a signed-in browser can query any table Postgres
 * will answer for, whatever this file hides. The two are deliberately
 * redundant. Keep them in step: a permission added here without a policy
 * behind it is a promise the database will not keep.
 *
 * See supabase/migrations/20260817120000_role_aware_rls.sql.
 */

/* ------------------------------------------------------------------ */
/*  Roles                                                              */
/* ------------------------------------------------------------------ */

export type ConsoleRole = "owner" | "admin" | "growth" | "contributor" | "viewer";

/**
 * Where a growth partner is in their own progression. It changes what
 * they can see rather than what they can do, which is why it is a
 * modifier on the growth role and not five more roles.
 */
export type GrowthStage = "advisor" | "head_of_growth" | "employee";

export interface ConsoleUser {
  userId: string;
  email: string;
  fullName: string | null;
  role: ConsoleRole;
  growthStage: GrowthStage | null;
  memberId: string | null;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Permissions                                                        */
/* ------------------------------------------------------------------ */

export type Permission =
  /* The console itself. Everyone who works here holds this; what differs
   * is which of the surfaces below they also hold, and the navigation is
   * filtered accordingly.
   *
   * There was briefly a second shell at /growth, built because the
   * partnership terms say "Admin console — Never". That line turned out
   * to mean the platform super-admin over in abram-network — plan tiers,
   * entitlements, other people's organisations — and not this marketing
   * console at all. One console with real roles is the simpler answer and
   * the correct reading, so the second shell is gone. */
  | "console.admin"

  /* Pipeline */
  | "crm.contacts.read.all"
  | "crm.contacts.read.own"
  | "crm.contacts.write.own"
  | "crm.contacts.delete"
  | "crm.accounts.manage"
  | "crm.deals.manage"
  | "crm.events.manage"

  /* Deal registration: filing a claim and deciding one are different jobs */
  | "crm.registrations.file"
  | "crm.registrations.decide"

  /* Email.
   *
   * Drafting a broadcast and sending one are deliberately separate. A
   * draft is editable and deletable; a send spends sending-domain
   * reputation that takes months to rebuild and reaches people who
   * cannot un-receive it. Anybody trusted to write the words is not
   * automatically trusted to press the button. */
  | "crm.email.send"
  | "crm.email.edit"
  | "broadcasts.draft"
  | "broadcasts.send"
  | "subscribers.read"

  /* Content — the admin console proper */
  | "content.docs"
  | "content.blog"
  | "content.changelog"
  | "content.team"

  /* Acquisition surfaces */
  | "social.manage"
  | "campaigns.manage"
  | "links.manage"
  | "promotions.manage"

  /* Numbers */
  | "analytics.read"
  | "analytics.write"
  | "commission.read.own"
  | "commission.manage"

  /* Administration */
  | "roles.manage";

/**
 * What each role carries before any stage modifier is applied.
 *
 * The `growth` row is the one worth reading closely, because it is the
 * one a written agreement constrains. Read it for what is *absent*: no
 * role management, no commission management, no release notes, no team
 * record, and `broadcasts.draft` without `broadcasts.send`. A partner
 * reads their own commission statement and can do nothing to it, and can
 * write a broadcast without being able to post it.
 */
const ROLE_PERMISSIONS: Record<ConsoleRole, Permission[]> = {
  owner: [
    "console.admin",
    "crm.contacts.read.all",
    "crm.contacts.read.own",
    "crm.contacts.write.own",
    "crm.contacts.delete",
    "crm.accounts.manage",
    "crm.deals.manage",
    "crm.events.manage",
    "crm.registrations.file",
    "crm.registrations.decide",
    "crm.email.send",
    "crm.email.edit",
    "broadcasts.draft",
    "broadcasts.send",
    "subscribers.read",
    "content.docs",
    "content.blog",
    "content.changelog",
    "content.team",
    "social.manage",
    "campaigns.manage",
    "links.manage",
    "promotions.manage",
    "analytics.read",
    "analytics.write",
    "commission.read.own",
    "commission.manage",
    "roles.manage",
  ],

  // Runs the site. Does not decide who else runs the site.
  admin: [
    "console.admin",
    "crm.contacts.read.all",
    "crm.contacts.read.own",
    "crm.contacts.write.own",
    "crm.contacts.delete",
    "crm.accounts.manage",
    "crm.deals.manage",
    "crm.events.manage",
    "crm.registrations.file",
    "crm.registrations.decide",
    "crm.email.send",
    "crm.email.edit",
    "broadcasts.draft",
    "broadcasts.send",
    "subscribers.read",
    "content.docs",
    "content.blog",
    "content.changelog",
    "content.team",
    "social.manage",
    "campaigns.manage",
    "links.manage",
    "promotions.manage",
    "analytics.read",
    "analytics.write",
    "commission.read.own",
    "commission.manage",
  ],

  // Acquisition, end to end. Note what is missing rather than what is
  // here: no roles, no commission management, no release notes, no team
  // record, and drafting a broadcast without being able to send it.
  growth: [
    "console.admin",
    "crm.contacts.read.own",
    "crm.contacts.write.own",
    "crm.accounts.manage",
    "crm.deals.manage",
    "crm.events.manage",
    "crm.registrations.file",
    "content.docs",
    "content.blog",
    "social.manage",
    "campaigns.manage",
    "links.manage",
    "promotions.manage",
    "subscribers.read",
    "broadcasts.draft",
    "analytics.read",
    "commission.read.own",
  ],

  // A writer. Content surfaces, nothing about people or money.
  contributor: [
    "console.admin",
    "content.docs",
    "content.blog",
    "content.changelog",
    "analytics.read",
  ],

  // Can look at the pipeline and change nothing.
  viewer: ["console.admin", "crm.contacts.read.own", "analytics.read"],
};

/**
 * What advancing a stage actually grants.
 *
 * Growth Advisor is "her accounts only, read and write". Head of Growth
 * is "full pipeline" and gains the ability to send a one-to-one email.
 * Both come straight from the access table in the partnership terms, and
 * this is the only place in the interface they are written down.
 */
const GROWTH_STAGE_PERMISSIONS: Record<GrowthStage, Permission[]> = {
  advisor: [],
  head_of_growth: ["crm.contacts.read.all", "crm.email.send", "analytics.write"],
  employee: ["crm.contacts.read.all", "crm.email.send", "analytics.write", "subscribers.read"],
};

/** Everything this person may do, role plus whatever their stage adds. */
export function permissionsFor(user: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null): Set<Permission> {
  if (!user || !user.isActive) return new Set();

  const granted = new Set<Permission>(ROLE_PERMISSIONS[user.role] ?? []);

  if (user.role === "growth" && user.growthStage) {
    for (const permission of GROWTH_STAGE_PERMISSIONS[user.growthStage] ?? []) {
      granted.add(permission);
    }
  }

  return granted;
}

export function can(
  user: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null,
  permission: Permission
): boolean {
  return permissionsFor(user).has(permission);
}

/** True when any one of these is held. Used by nav groups. */
export function canAny(
  user: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null,
  permissions: Permission[]
): boolean {
  const granted = permissionsFor(user);
  return permissions.some((permission) => granted.has(permission));
}

/**
 * Whether this person sees the whole board or only their own rows.
 * Mirrors public.growth_sees_all_contacts() in the database.
 */
export function seesWholePipeline(user: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null): boolean {
  return can(user, "crm.contacts.read.all");
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * Which permission a path requires.
 *
 * Ordered most specific first, and matched by prefix. The middleware
 * walks this list and takes the first hit, so `/admin/dashboard/crm` has
 * to appear before `/admin/dashboard` or the general rule would swallow
 * it.
 *
 * A path under a guarded root with no entry here is refused rather than
 * allowed. That is the important default: a new page added without a
 * thought about permissions fails closed and its author notices
 * immediately, instead of shipping open and nobody noticing at all.
 */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/admin/dashboard/crm", permission: "crm.contacts.read.own" },
  { prefix: "/admin/dashboard/registrations", permission: "crm.registrations.file" },
  { prefix: "/admin/dashboard/earnings", permission: "commission.read.own" },
  { prefix: "/admin/dashboard/docs", permission: "content.docs" },
  { prefix: "/admin/dashboard/blog", permission: "content.blog" },
  { prefix: "/admin/dashboard/changelog", permission: "content.changelog" },
  { prefix: "/admin/dashboard/team", permission: "content.team" },
  { prefix: "/admin/dashboard/social", permission: "social.manage" },
  { prefix: "/admin/dashboard/campaigns", permission: "campaigns.manage" },
  { prefix: "/admin/dashboard/links", permission: "links.manage" },
  { prefix: "/admin/dashboard/promotions", permission: "promotions.manage" },
  { prefix: "/admin/dashboard/subscribers", permission: "subscribers.read" },
  { prefix: "/admin/dashboard/broadcasts", permission: "broadcasts.draft" },
  { prefix: "/admin/dashboard/people", permission: "roles.manage" },
  { prefix: "/admin/dashboard/revenue", permission: "commission.manage" },
  { prefix: "/admin/dashboard", permission: "console.admin" },
];

/** The permission a path needs, or null when it is not a guarded path. */
export function permissionForPath(pathname: string): Permission | null {
  const clean = pathname.replace(/\/$/, "") || "/";
  const match = ROUTE_PERMISSIONS.find(
    (route) => clean === route.prefix || clean.startsWith(route.prefix + "/")
  );
  return match ? match.permission : null;
}

/**
 * Where to send somebody who just signed in.
 *
 * A growth partner landing on the admin console would get a redirect
 * loop or an empty page depending on which guard caught them first, so
 * the decision is made once, here, and both the login form and the
 * middleware use it.
 */
export function landingPathFor(user: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null): string {
  if (!user || !user.isActive) return "/admin";
  return can(user, "console.admin") ? "/admin/dashboard" : "/admin";
}

/* ------------------------------------------------------------------ */
/*  Labels                                                             */
/* ------------------------------------------------------------------ */

export const ROLE_LABELS: Record<ConsoleRole, string> = {
  owner: "Owner",
  admin: "Admin",
  growth: "Growth",
  contributor: "Contributor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<ConsoleRole, string> = {
  owner: "Everything, including who else has a login.",
  admin: "Everything except handing out roles.",
  growth: "The Growth workspace. Never the admin console.",
  contributor: "Docs, blog and release notes. Nothing about people or money.",
  viewer: "Reads the pipeline, changes nothing.",
};

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  advisor: "Growth Advisor",
  head_of_growth: "Head of Growth",
  employee: "Employed",
};

export const GROWTH_STAGE_DESCRIPTIONS: Record<GrowthStage, string> = {
  advisor: "Sees and works only the accounts assigned to them.",
  head_of_growth: "Sees the whole pipeline, edits their own accounts, may send one-to-one email.",
  employee: "Post-conversion. Full pipeline and the mailing list.",
};
