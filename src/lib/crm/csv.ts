/**
 * Reading a spreadsheet somebody exported from something else.
 *
 * A hand-rolled parser rather than a dependency, because the input is one
 * shape: a file a person exported from HubSpot, Mailchimp or Excel and
 * handed to this console. What that file actually does that a naive split
 * on commas gets wrong is quoting, and quoting is thirty lines.
 *
 * Three details that are not obvious and cost an afternoon each:
 *
 *   - A quoted field may contain commas, newlines and doubled quotes.
 *     `"Thomas, Abram, LLC"` is one cell and `""` inside quotes is one
 *     quote character.
 *   - Excel writes a byte order mark at the front of a UTF-8 file. Left
 *     in, the first header becomes `﻿Email` and matches nothing.
 *   - Line endings are \r\n from Windows, \n from everything else, and
 *     occasionally \r alone from an old Mac export.
 */

/** One parsed file: the header row, and every row under it. */
export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    // A trailing newline should not produce a row of one empty string.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      endCell();
    } else if (char === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
    } else if (char === "\n") {
      endRow();
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) endRow();

  const headers = (rows.shift() ?? []).map((header) => header.trim());
  return { headers, rows };
}

/* ------------------------------------------------------------------ */
/*  Guessing what a column is                                          */
/* ------------------------------------------------------------------ */

/** The fields an import can fill in. Email is the only required one. */
export type ImportField =
  | "email"
  | "full_name"
  | "first_name"
  | "last_name"
  | "company"
  | "job_title"
  | "phone"
  | "ignore";

/**
 * Header names seen in the wild, per field.
 *
 * Matched after lowercasing and stripping anything that is not a letter,
 * so "First Name", "first_name" and "FirstName" are one thing. This is a
 * guess the person can override, and it exists so the common case is
 * "check the mapping" rather than "build the mapping".
 */
const HINTS: Record<Exclude<ImportField, "ignore">, string[]> = {
  email: ["email", "emailaddress", "workemail", "primaryemail", "mail"],
  full_name: ["name", "fullname", "contactname", "person"],
  first_name: ["firstname", "givenname", "forename"],
  last_name: ["lastname", "surname", "familyname"],
  company: ["company", "companyname", "organisation", "organization", "account", "employer"],
  job_title: ["jobtitle", "title", "role", "position"],
  phone: ["phone", "phonenumber", "mobile", "telephone", "tel"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

/** The best guess for one header, or `ignore` when nothing fits. */
export function guessField(header: string): ImportField {
  const key = normalizeHeader(header);
  if (!key) return "ignore";

  for (const [field, hints] of Object.entries(HINTS)) {
    if (hints.includes(key)) return field as ImportField;
  }
  // "Email Address 1" and the like: contained rather than equal, checked
  // second so an exact match always wins.
  for (const [field, hints] of Object.entries(HINTS)) {
    if (hints.some((hint) => key.includes(hint))) return field as ImportField;
  }
  return "ignore";
}

export function guessMapping(headers: string[]): ImportField[] {
  const used = new Set<ImportField>();
  return headers.map((header) => {
    const guess = guessField(header);
    // One column per field. A second "Name" column is left alone rather
    // than quietly overwriting the first.
    if (guess === "ignore" || used.has(guess)) return "ignore";
    used.add(guess);
    return guess;
  });
}

/* ------------------------------------------------------------------ */
/*  A row, as a person                                                 */
/* ------------------------------------------------------------------ */

export interface ImportedPerson {
  email: string;
  fullName: string;
  company: string;
  jobTitle: string;
  phone: string;
}

/**
 * One CSV row folded into a person, or null when it has no usable email.
 *
 * A first and last name column are joined; a full name column wins over
 * both, because a file carrying all three has already decided.
 */
export function readPerson(
  row: string[],
  mapping: ImportField[]
): ImportedPerson | null {
  const value = (field: ImportField) => {
    const index = mapping.indexOf(field);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };

  const email = value("email").toLowerCase();
  if (!email || !email.includes("@")) return null;

  const joined = [value("first_name"), value("last_name")].filter(Boolean).join(" ");

  return {
    email,
    fullName: value("full_name") || joined,
    company: value("company"),
    jobTitle: value("job_title"),
    phone: value("phone"),
  };
}

/** Every readable person in the file, deduplicated on email, first wins. */
export function readPeople(parsed: ParsedCsv, mapping: ImportField[]) {
  const people: ImportedPerson[] = [];
  const seen = new Set<string>();
  let unusable = 0;
  let duplicatesInFile = 0;

  for (const row of parsed.rows) {
    const person = readPerson(row, mapping);
    if (!person) {
      unusable++;
      continue;
    }
    if (seen.has(person.email)) {
      duplicatesInFile++;
      continue;
    }
    seen.add(person.email);
    people.push(person);
  }

  return { people, unusable, duplicatesInFile };
}
