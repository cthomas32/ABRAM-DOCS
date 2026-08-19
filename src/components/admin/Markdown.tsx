import React from "react";

/**
 * Markdown, drawn without a compiler.
 *
 * The public documentation site runs MDX through `next-mdx-remote`, which
 * is the right tool there: those pages carry components, and the content
 * is compiled at build time where a syntax error is a build failure
 * somebody sees immediately.
 *
 * This is for prose typed into a textarea and saved a second later. MDX
 * would compile it at render time, and a stray `<` or an unclosed brace
 * in a half written sentence would throw inside a server component, which
 * is a blank screen rather than a warning. A document store whose reader
 * crashes on a draft is a document store nobody drafts in.
 *
 * So this handles the marks prose actually uses and passes everything
 * else through as text. No HTML is interpreted, and nothing here calls
 * `dangerouslySetInnerHTML`, so a paste from a web page cannot bring a
 * script with it.
 *
 * What is deliberately missing: tables, images, footnotes, nested lists.
 * Add them when a document needs them rather than in advance.
 */

/** Bold, italic and inline code, in one pass so they cannot nest wrongly. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="font-mono text-[0.9em] px-1 py-0.5 rounded bg-white/[0.06] text-zinc-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const lines = (source ?? "").split("\n");
  const blocks: React.ReactNode[] = [];

  let listBuffer: string[] = [];
  let codeBuffer: string[] | null = null;
  let quoteBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 text-zinc-300">
        {listBuffer.map((item, index) => (
          <li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  function flushQuote() {
    if (quoteBuffer.length === 0) return;
    blocks.push(
      <blockquote
        key={`bq-${blocks.length}`}
        className="border-l-2 border-white/15 pl-4 text-zinc-400 italic"
      >
        {quoteBuffer.map((item, index) => (
          <p key={index}>{inline(item, `bq-${blocks.length}-${index}`)}</p>
        ))}
      </blockquote>
    );
    quoteBuffer = [];
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    /* A fence swallows everything until the closing fence, so markdown
       inside a code block stays code. */
    if (line.trimStart().startsWith("```")) {
      if (codeBuffer === null) {
        flushList();
        flushQuote();
        codeBuffer = [];
      } else {
        blocks.push(
          <pre
            key={`pre-${blocks.length}`}
            className="rounded-xl border border-white/8 bg-black/40 p-3.5 overflow-x-auto"
          >
            <code className="font-mono text-[11px] text-zinc-300 whitespace-pre">
              {codeBuffer.join("\n")}
            </code>
          </pre>
        );
        codeBuffer = null;
      }
      continue;
    }

    if (codeBuffer !== null) {
      codeBuffer.push(raw);
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      flushQuote();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-sm font-semibold text-white mt-5">
          {inline(line.slice(4), `h3-${blocks.length}`)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      flushQuote();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-base font-semibold text-white mt-6">
          {inline(line.slice(3), `h2-${blocks.length}`)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      flushQuote();
      blocks.push(
        <h1 key={`h1-${blocks.length}`} className="text-lg font-bold text-white mt-6 first:mt-0">
          {inline(line.slice(2), `h1-${blocks.length}`)}
        </h1>
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushQuote();
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (line.startsWith("> ")) {
      flushList();
      quoteBuffer.push(line.slice(2));
    } else if (/^\s*---+\s*$/.test(line)) {
      flushList();
      flushQuote();
      blocks.push(<hr key={`hr-${blocks.length}`} className="border-white/8" />);
    } else if (line.trim() === "") {
      flushList();
      flushQuote();
    } else {
      flushList();
      flushQuote();
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-zinc-300 leading-relaxed">
          {inline(line, `p-${blocks.length}`)}
        </p>
      );
    }
  }

  flushList();
  flushQuote();
  if (codeBuffer !== null && codeBuffer.length > 0) {
    /* An unclosed fence. Draw what is there rather than dropping it: this
       is exactly the half written state the reader has to survive. */
    blocks.push(
      <pre
        key={`pre-${blocks.length}`}
        className="rounded-xl border border-white/8 bg-black/40 p-3.5 overflow-x-auto"
      >
        <code className="font-mono text-[11px] text-zinc-300 whitespace-pre">
          {codeBuffer.join("\n")}
        </code>
      </pre>
    );
  }

  return <div className={`space-y-3 text-xs break-words ${className}`}>{blocks}</div>;
}
