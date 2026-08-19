/**
 * Turning the company somebody typed into the company record we hold.
 *
 * `crm_contacts.company` is free text a person types at a conference, and
 * `crm_contacts.account_id` is a foreign key to a real account. Nothing
 * reconciled the two, so the pipeline filled up with people who plainly
 * work at Helix and are attached to no Helix, and the Companies screen,
 * which reads through `account_id`, could not see them to say so.
 *
 * This module answers one question and does not act on the answer:
 *
 *   given what is typed on a person, which account is that?
 *
 * It is pure and takes the candidate list as an argument, so the person
 * page can call it against the accounts it already loaded rather than
 * making a round trip, and the Companies screen can call it over every
 * unlinked contact at once. Deciding is separate from writing on purpose:
 * a wrong link is a person filed under the wrong company's commission,
 * so the write is always a click and never a background repair.
 *
 * TWO KEYS, IN THIS ORDER, AND NEVER A THIRD
 *
 *   1. The email domain, compared to `lower(crm_accounts.domain)`. This
 *      is the only one that is close to evidence: an address at helix.com
 *      is issued by Helix and cannot be typed two ways.
 *   2. The company name, normalised. Weaker, because "Helix", "Helix
 *      Studios" and "Helix Studios Ltd" are one company and "Helix Post"
 *      is a different one.
 *
 * There is no fuzzy third pass. Levenshtein over company names finds
 * "Helix" in "Phoenix" long before anybody notices, and the cost of a
 * wrong match here is not a tidy-up, it is money attributed to the wrong
 * account. When neither key hits, the answer is no answer, and the
 * interface offers to create the company instead.
 */

/**
 * Domains that name a mailbox provider rather than an employer.
 *
 * Without this, the first person who hands over a gmail address creates
 * an account called Gmail and the next four hundred join it. That is a
 * worse state than no account at all, because it looks like a company.
 */
const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "live.co.uk",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "mail.com",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "fastmail.com",
  "hey.com",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "web.de",
  "t-online.de",
  "orange.fr",
  "free.fr",
  "wanadoo.fr",
  "libero.it",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "comcast.net",
  "verizon.net",
  "sbcglobal.net",
  "att.net",
  "bellsouth.net",
  "cox.net",
  "shaw.ca",
  "rogers.com",
  "bigpond.com",
  "optusnet.com.au",
]);

/**
 * Words that are a company's legal wrapper rather than its name.
 *
 * Stripped only from the end, and only these. "Studios", "Post",
 * "Pictures" and "Media" are deliberately absent: they are what tells
 * Helix Studios apart from Helix Post, and merging those two is the exact
 * failure this file exists to avoid.
 */
const LEGAL_SUFFIXES = new Set([
  "ltd",
  "limited",
  "llc",
  "llp",
  "lp",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "co",
  "company",
  "plc",
  "gmbh",
  "ag",
  "bv",
  "nv",
  "sa",
  "sas",
  "sarl",
  "srl",
  "spa",
  "ab",
  "as",
  "oy",
  "aps",
  "pty",
  "pte",
  "kk",
  "kft",
  "sp",
  "zoo",
]);

export interface AccountLike {
  id: string;
  name: string;
  domain: string | null;
}

export type MatchKey = "domain" | "name";

export interface AccountMatch<T extends AccountLike> {
  account: T;
  /** Which key hit. The interface says so, because the two differ in strength. */
  matchedOn: MatchKey;
}

/** Bare host, lowercased, `www.` removed. Accepts a domain or a pasted URL. */
export function normalizeDomain(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) return null;

  const host = trimmed
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/^www\./, "")
    .replace(/\.$/, "");

  if (!host.includes(".") || /\s/.test(host)) return null;
  return host;
}

/**
 * The employer half of an address, or null when it names nobody.
 *
 * Null for a malformed address and null for a mailbox provider, and the
 * caller cannot tell the two apart on purpose: in both cases the email
 * says nothing about where this person works.
 */
export function employerDomain(email: string | null | undefined): string | null {
  const at = (email ?? "").trim().toLowerCase().lastIndexOf("@");
  if (at < 1) return null;

  const host = normalizeDomain((email ?? "").trim().toLowerCase().slice(at + 1));
  if (!host) return null;
  return CONSUMER_DOMAINS.has(host) ? null : host;
}

/** True when this address is at a mailbox provider rather than an employer. */
export function isConsumerDomain(domain: string | null | undefined): boolean {
  const host = normalizeDomain(domain);
  return host ? CONSUMER_DOMAINS.has(host) : false;
}

/**
 * A company name reduced to the part that identifies it.
 *
 * Lowercased, accents folded, punctuation dropped, a leading "the"
 * removed, and one trailing legal suffix removed. Returns "" when there
 * is nothing left, which never matches anything.
 */
export function normalizeCompanyName(raw: string | null | undefined): string {
  const base = (raw ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Spelled out before punctuation is stripped, so "Smith & Co" and
    // "Smith and Co" reduce alike rather than to "smith" and "smith and".
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!base) return "";

  const words = base.split(" ").filter(Boolean);
  if (words[0] === "the" && words.length > 1) words.shift();

  // One suffix only, so "Helix Ltd" loses "ltd" and a company genuinely
  // called "Co Co" keeps a word to be identified by. Looping here would
  // reduce "Sky Co Ltd" to "sky", which is a different company.
  if (words.length > 1 && LEGAL_SUFFIXES.has(words[words.length - 1])) {
    words.pop();
  }

  return words.join(" ");
}

/**
 * Which account this person belongs to, or null when nothing is certain.
 *
 * Domain first and name second, and a name hit is refused when it is
 * ambiguous: two accounts normalising to the same name mean the answer is
 * genuinely unknown, and picking the first one alphabetically is a guess
 * wearing a decision's clothes.
 */
export function matchAccount<T extends AccountLike>(
  person: { company?: string | null; email?: string | null; website?: string | null },
  accounts: readonly T[]
): AccountMatch<T> | null {
  const domain = employerDomain(person.email) ?? normalizeDomain(person.website);

  if (domain && !CONSUMER_DOMAINS.has(domain)) {
    const hit = accounts.find((account) => normalizeDomain(account.domain) === domain);
    if (hit) return { account: hit, matchedOn: "domain" };
  }

  const name = normalizeCompanyName(person.company);
  if (!name) return null;

  const named = accounts.filter((account) => normalizeCompanyName(account.name) === name);
  if (named.length === 1) return { account: named[0], matchedOn: "name" };

  return null;
}

export interface AccountSuggestion {
  name: string;
  domain: string | null;
}

/**
 * What to call the account this person's company would become.
 *
 * The name is what they typed, trimmed and otherwise untouched: the
 * normalisation above is a matching key and a poor display name, and
 * nobody wants a company called "helix". The domain is filled in from
 * their address only when it names an employer.
 *
 * Null when there is no company text, because an account needs a name and
 * a domain alone does not supply one worth showing.
 */
export function suggestAccount(person: {
  company?: string | null;
  email?: string | null;
  website?: string | null;
}): AccountSuggestion | null {
  const name = (person.company ?? "").trim();
  if (!name) return null;

  return {
    name,
    domain: employerDomain(person.email) ?? normalizeDomain(person.website),
  };
}
