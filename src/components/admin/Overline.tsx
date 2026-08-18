/**
 * The one label.
 *
 * A section heading, a stat label and a form label are the same thing on
 * this console: a small word that names what is under it. They were being
 * written three ways, at two sizes and two trackings, and the difference
 * read as meaning that was not there. There is one recipe from here on.
 *
 * It names its section. It does not tease it, so no kicker text and no
 * sentence fragments leading into a heading.
 */

import React from "react";

export default function Overline({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: React.ReactNode;
  /** `label` when it sits above a field, `h2` when it opens a section. */
  as?: "span" | "h2" | "h3" | "label";
  className?: string;
}) {
  return (
    <Tag className={`block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans ${className}`}>
      {children}
    </Tag>
  );
}

/**
 * The same label bound to a field. Separate because a `label` needs
 * `htmlFor` and nothing else does.
 */
export function FieldLabel({
  htmlFor,
  children,
  hint,
  className = "",
}: {
  htmlFor: string;
  children: React.ReactNode;
  /** Shown after the label in sentence case. Use it for "(optional)". */
  hint?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans mb-1.5 ${className}`}
    >
      {children}
      {hint && <span className="text-zinc-600 normal-case tracking-normal font-medium"> {hint}</span>}
    </label>
  );
}
