import React from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { CopyButton } from "./CopyButton";

// Convert kebab-case/lowercase icon names to PascalCase for Lucide icons
function getIconComponent(iconName?: string) {
  if (!iconName) return null;
  const pascalName = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>;
  return icons[pascalName] || icons[iconName] || LucideIcons.HelpCircle;
}

// Simple and robust syntax highlighting tokenizer
function highlightCode(code: string, language: string) {
  if (!code) return "";

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalizedLang = language.toLowerCase();
  if (["txt", "text", "bash", "sh", "shell"].includes(normalizedLang)) {
    return escapeHtml(code);
  }

  // Token definitions with regex
  const tokens = [
    { type: "comment", regex: /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g },
    { type: "string", regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g },
    { type: "number", regex: /\b(\d+(?:\.\d+)?)\b/g },
    { type: "keyword", regex: /\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|async|await|yield|this|super|interface|type|public|private|protected|readonly|as|any|string|number|boolean|void|never|unknown|null|undefined|true|false)\b/g },
    { type: "tag", regex: /(<\/?[a-zA-Z0-9_-]+>?)/g },
    { type: "attr", regex: /\b(className|style|id|href|src|alt|title|type|value|onClick|onChange|onSubmit)\b/g }
  ];

  let parts: { text: string; type?: string }[] = [{ text: code }];

  for (const token of tokens) {
    const nextParts: typeof parts = [];
    for (const part of parts) {
      if (part.type) {
        nextParts.push(part);
        continue;
      }

      let lastIndex = 0;
      token.regex.lastIndex = 0;
      let match;
      const matches: RegExpExecArray[] = [];

      while ((match = token.regex.exec(part.text)) !== null) {
        matches.push(match);
        if (token.regex.lastIndex === match.index) {
          token.regex.lastIndex++;
        }
      }

      for (const m of matches) {
        const textBefore = part.text.substring(lastIndex, m.index);
        if (textBefore) {
          nextParts.push({ text: textBefore });
        }
        nextParts.push({ text: m[0], type: token.type });
        lastIndex = token.regex.lastIndex;
      }

      const textAfter = part.text.substring(lastIndex);
      if (textAfter) {
        nextParts.push({ text: textAfter });
      }
    }
    parts = nextParts;
  }

  return parts
    .map((part) => {
      const escaped = escapeHtml(part.text);
      if (part.type === "comment") {
        return `<span class="text-zinc-500 italic">${escaped}</span>`;
      }
      if (part.type === "string") {
        return `<span class="text-amber-300 dark:text-amber-200">${escaped}</span>`;
      }
      if (part.type === "number") {
        return `<span class="text-blue-400">${escaped}</span>`;
      }
      if (part.type === "keyword") {
        return `<span class="text-emerald-400 font-medium">${escaped}</span>`;
      }
      if (part.type === "tag") {
        return `<span class="text-rose-400">${escaped}</span>`;
      }
      if (part.type === "attr") {
        return `<span class="text-sky-300">${escaped}</span>`;
      }
      return escaped;
    })
    .join("");
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const highlighted = highlightCode(code, language);

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-50 font-mono text-sm shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-zinc-400">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed">
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
}

// Heading Overrides (ABRAM Design Language)
export const h1 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className="font-heading text-2xl font-bold uppercase tracking-wide mt-8 mb-4 text-zinc-900 dark:text-zinc-50" {...props}>
    {children}
  </h1>
);

export const h2 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="font-heading text-xl font-bold uppercase tracking-wide mt-6 mb-3 text-zinc-900 dark:text-zinc-50" {...props}>
    {children}
  </h2>
);

export const h3 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className="font-heading text-lg font-bold uppercase tracking-wide mt-5 mb-2 text-zinc-900 dark:text-zinc-100" {...props}>
    {children}
  </h3>
);

export const h4 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4 className="font-heading text-base font-bold uppercase tracking-wide mt-4 mb-2 text-zinc-900 dark:text-zinc-200" {...props}>
    {children}
  </h4>
);

// Standard HTML tag overrides
export const p = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="my-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400" {...props}>
    {children}
  </p>
);

export const a = ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 font-medium transition" {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 font-medium transition" {...props}>
      {children}
    </a>
  );
};

export const ul = ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className="list-disc pl-6 my-4 text-zinc-700 dark:text-zinc-300 space-y-2" {...props}>
    {children}
  </ul>
);

export const ol = ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
  <ol className="list-decimal pl-6 my-4 text-zinc-700 dark:text-zinc-300 space-y-2" {...props}>
    {children}
  </ol>
);

export const li = ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
  <li className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300" {...props}>
    {children}
  </li>
);

// Custom Blockquote featuring support for GitHub-style Alerts
export const blockquote = ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => {
  let alertType: "note" | "important" | "warning" | "tip" | "caution" | null = null;
  let cleanChildren = children;

  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];

  if (React.isValidElement(firstChild)) {
    const firstChildElement = firstChild as React.ReactElement<{ children?: React.ReactNode }>;
    const pChildren = React.Children.toArray(firstChildElement.props.children);
    const firstPChild = pChildren[0];

    if (typeof firstPChild === "string") {
      const match = firstPChild.match(/^\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*(.*)/i);
      if (match) {
        alertType = match[1].toLowerCase() as "note" | "important" | "warning" | "tip" | "caution";
        const remainingText = match[2];
        const restPChildren = pChildren.slice(1);
        const newFirstPChildren = remainingText ? [remainingText, ...restPChildren] : restPChildren;
        const newFirstChild = React.cloneElement(firstChild as React.ReactElement, {}, ...newFirstPChildren);
        cleanChildren = [newFirstChild, ...childrenArray.slice(1)];
      }
    }
  } else if (typeof firstChild === "string") {
    const match = firstChild.match(/^\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*(.*)/i);
    if (match) {
      alertType = match[1].toLowerCase() as "note" | "important" | "warning" | "tip" | "caution";
      const remainingText = match[2];
      cleanChildren = [remainingText, ...childrenArray.slice(1)];
    }
  }

  if (alertType) {
    const styles = {
      note: {
        border: "border-l-4 border-emerald-500",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
        text: "text-emerald-900 dark:text-emerald-300",
        icon: <LucideIcons.Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
        label: "Note"
      },
      important: {
        border: "border-l-4 border-sky-500",
        bg: "bg-sky-50/50 dark:bg-sky-950/10",
        text: "text-sky-900 dark:text-sky-300",
        icon: <LucideIcons.Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />,
        label: "Important"
      },
      warning: {
        border: "border-l-4 border-amber-500",
        bg: "bg-amber-50/50 dark:bg-amber-950/10",
        text: "text-amber-900 dark:text-amber-300",
        icon: <LucideIcons.AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
        label: "Warning"
      },
      tip: {
        border: "border-l-4 border-indigo-500",
        bg: "bg-indigo-50/50 dark:bg-indigo-950/10",
        text: "text-indigo-900 dark:text-indigo-300",
        icon: <LucideIcons.Lightbulb className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />,
        label: "Tip"
      },
      caution: {
        border: "border-l-4 border-red-500",
        bg: "bg-red-50/50 dark:bg-red-950/10",
        text: "text-red-900 dark:text-red-300",
        icon: <LucideIcons.AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
        label: "Caution"
      }
    };

    const config = styles[alertType] || styles.note;

    return (
      <div className={`my-6 flex gap-4 rounded-r-lg border-y border-r border-zinc-200/50 dark:border-zinc-800/50 p-4 ${config.border} ${config.bg} ${config.text}`}>
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="font-heading text-xs font-bold uppercase tracking-wider mb-1 text-zinc-900 dark:text-zinc-50">
            {config.label}
          </div>
          <div className="text-sm leading-relaxed prose-sm dark:prose-invert">
            {cleanChildren}
          </div>
        </div>
      </div>
    );
  }

  return (
    <blockquote className="my-6 border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic text-zinc-700 dark:text-zinc-300">
      {children}
    </blockquote>
  );
};

// Custom Tables
export const table = ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="my-6 w-full overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
    <table className="w-full border-collapse text-left text-sm" {...props}>
      {children}
    </table>
  </div>
);

export const thead = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800" {...props}>
    {children}
  </thead>
);

export const tbody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800" {...props}>
    {children}
  </tbody>
);

export const tr = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors" {...props}>
    {children}
  </tr>
);

export const th = ({ children, ...props }: React.HTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100" {...props}>
    {children}
  </th>
);

export const td = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-sm" {...props}>
    {children}
  </td>
);

// Code pre override
export const pre = ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
  const codeElement = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.type === "code" || (typeof child.type === "function" && (child.type as { name?: string }).name === "code"))
  ) as React.ReactElement<{ children?: React.ReactNode; className?: string }> | undefined;

  if (codeElement) {
    const codeText = codeElement.props.children || "";
    const className = codeElement.props.className || "";
    const language = className.replace(/language-/, "") || "text";
    return <CodeBlock code={String(codeText).trim()} language={language} />;
  }

  return (
    <pre className="my-6 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-50" {...props}>
      {children}
    </pre>
  );
};

export const code = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <code className="rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200" {...props}>
    {children}
  </code>
);

// Custom layout components inside MDX (Columns, Card, Icon)
export function Columns({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 md:grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-4 my-6`}>
      {children}
    </div>
  );
}

export function Card({
  title,
  icon,
  href,
  children,
  horizontal = false,
}: {
  title: string;
  icon?: string;
  href?: string;
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  const IconComponent = getIconComponent(icon);

  const cardContent = (
    <div className={`flex ${horizontal ? "flex-row items-center gap-4" : "flex-col gap-2"} p-5 h-full`}>
      {IconComponent && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
          {React.createElement(IconComponent, { className: "h-5 w-5" })}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
          {title}
        </h4>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );

  const className = "block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-emerald-500/50 hover:shadow-md dark:hover:border-emerald-500/30 transition-all duration-200 h-full overflow-hidden no-underline";

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {cardContent}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {cardContent}
      </a>
    );
  }

  return <div className={className}>{cardContent}</div>;
}

export function Icon({ icon, size = 16, className }: { icon: string; size?: number; className?: string }) {
  const IconComponent = getIconComponent(icon);
  if (!IconComponent) return null;
  return React.createElement(IconComponent, { size, className });
}

// Gather all component overrides in a single map
export const mdxComponents = {
  h1,
  h2,
  h3,
  h4,
  p,
  a,
  ul,
  ol,
  li,
  blockquote,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
  pre,
  code,
  Columns,
  Card,
  Icon,
};
