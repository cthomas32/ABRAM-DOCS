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

// Helper to recursively extract raw text from React children nodes
const getTextBoxes = (node: React.ReactNode): string => {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextBoxes).join("");
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return getTextBoxes(element.props.children);
  }
  return "";
};

// Convert string to URL-friendly slug
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Parse standard inline CSS style string into React.CSSProperties object
function parseInlineStyle(style: any): React.CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === "object") return style as React.CSSProperties;
  if (typeof style === "string") {
    const styleObj: Record<string, string> = {};
    style.split(";").forEach((rules) => {
      const parts = rules.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const val = parts.slice(1).join(":").trim();
        if (key && val) {
          styleObj[key] = val;
        }
      }
    });
    return styleObj as React.CSSProperties;
  }
  return undefined;
}

// Omit unsafe/string style from props and apply parsed style
export function getSafeProps<T extends { style?: any }>(props: T): Omit<T, "style"> & { style?: React.CSSProperties } {
  const { style, ...rest } = props;
  return {
    ...rest,
    ...(style ? { style: parseInlineStyle(style) } : {}),
  } as any;
}

// Heading Overrides (ABRAM Design Language)
export const h1 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className="text-3xl font-bold tracking-tight mt-10 mb-4 text-zinc-900 dark:text-zinc-50" {...getSafeProps(props)}>
    {children}
  </h1>
);

export const h2 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  const text = getTextBoxes(children);
  const id = slugify(text);
  return (
    <h2 id={id} className="text-2xl font-semibold tracking-tight mt-8 mb-3 text-zinc-900 dark:text-zinc-50 scroll-mt-24" {...getSafeProps(props)}>
      {children}
    </h2>
  );
};

export const h3 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  const text = getTextBoxes(children);
  const id = slugify(text);
  return (
    <h3 id={id} className="text-xl font-semibold tracking-tight mt-6 mb-2 text-zinc-900 dark:text-zinc-100 scroll-mt-24" {...getSafeProps(props)}>
      {children}
    </h3>
  );
};

export const h4 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4 className="text-lg font-semibold tracking-tight mt-5 mb-2 text-zinc-900 dark:text-zinc-200" {...getSafeProps(props)}>
    {children}
  </h4>
);

// Standard HTML tag overrides
export const p = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="my-5 text-base leading-7 text-zinc-600 dark:text-zinc-400" {...getSafeProps(props)}>
    {children}
  </p>
);

import MdxLink from "./MdxLink";

export const a = MdxLink;

export const ul = ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className="list-disc pl-5 my-5 text-zinc-600 dark:text-zinc-400 space-y-2" {...getSafeProps(props)}>
    {children}
  </ul>
);

export const ol = ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
  <ol className="list-decimal pl-5 my-5 text-zinc-600 dark:text-zinc-400 space-y-2" {...getSafeProps(props)}>
    {children}
  </ol>
);

export const li = ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
  <li className="text-base leading-7 text-zinc-600 dark:text-zinc-400" {...getSafeProps(props)}>
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
          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-900 dark:text-zinc-50">
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
    <blockquote className="my-6 border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 italic text-zinc-600 dark:text-zinc-400">
      {children}
    </blockquote>
  );
};

// Helper to identify React element types in MDX components
const isElementType = (element: React.ReactNode, typeName: string, componentRef?: unknown): boolean => {
  if (!React.isValidElement(element)) return false;
  const type = element.type;
  if (!type) return false;
  
  // Direct tag name check
  if (typeof type === "string" && type.toLowerCase() === typeName.toLowerCase()) {
    return true;
  }
  
  // Direct reference check
  if (componentRef && type === componentRef) {
    return true;
  }
  
  // Function / Class name check
  if (typeof type === "function" && type.name && type.name.toLowerCase() === typeName.toLowerCase()) {
    return true;
  }
  
  // displayName check
  const typeAsObject = type as unknown as Record<string, unknown>;
  if (
    typeAsObject &&
    (typeof typeAsObject === "object" || typeof typeAsObject === "function") &&
    "displayName" in typeAsObject &&
    typeof typeAsObject.displayName === "string" &&
    typeAsObject.displayName.toLowerCase() === typeName.toLowerCase()
  ) {
    return true;
  }
  
  return false;
};

// Custom Tables
export const table = ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => {
  const childrenArray = React.Children.toArray(children);
  
  // Check if there is already a thead, tbody, or tfoot container in the children
  const hasTheadOrTbody = childrenArray.some(
    (child) =>
      isElementType(child, "thead", thead) ||
      isElementType(child, "tbody", tbody) ||
      isElementType(child, "tfoot")
  );

  let processedChildren = children;

  if (!hasTheadOrTbody) {
    const trElements: React.ReactNode[] = [];
    const otherElements: React.ReactNode[] = [];

    childrenArray.forEach((child) => {
      if (isElementType(child, "tr", tr)) {
        trElements.push(child);
      } else {
        otherElements.push(child);
      }
    });

    if (trElements.length > 0) {
      const headerTrs: React.ReactNode[] = [];
      const bodyTrs: React.ReactNode[] = [];

      trElements.forEach((trNode) => {
        if (React.isValidElement(trNode)) {
          const trElement = trNode as React.ReactElement<{ children?: React.ReactNode }>;
          const trChildren = React.Children.toArray(trElement.props.children);
          const hasTh = trChildren.some((c) => isElementType(c, "th", th));
          if (hasTh) {
            headerTrs.push(trNode);
          } else {
            bodyTrs.push(trNode);
          }
        } else {
          bodyTrs.push(trNode);
        }
      });

      processedChildren = (
        <>
          {headerTrs.length > 0 && (
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              {headerTrs}
            </thead>
          )}
          {bodyTrs.length > 0 && (
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {bodyTrs}
            </tbody>
          )}
          {otherElements}
        </>
      );
    }
  }

  return (
    <div className="my-6 w-full overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <table className="w-full border-collapse text-left text-sm" {...getSafeProps(props)}>
        {processedChildren}
      </table>
    </div>
  );
};
table.displayName = "table";

export const thead = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800" {...getSafeProps(props)}>
    {children}
  </thead>
);
thead.displayName = "thead";

export const tbody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800" {...getSafeProps(props)}>
    {children}
  </tbody>
);
tbody.displayName = "tbody";

export const tr = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors" {...getSafeProps(props)}>
    {children}
  </tr>
);
tr.displayName = "tr";

export const th = ({ children, ...props }: React.HTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100" {...getSafeProps(props)}>
    {children}
  </th>
);
th.displayName = "th";

export const td = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-sm" {...getSafeProps(props)}>
    {children}
  </td>
);
td.displayName = "td";

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
    <pre className="my-6 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-50" {...getSafeProps(props)}>
      {children}
    </pre>
  );
};

export const code = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <code className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 font-mono text-[0.875em] text-zinc-900 dark:text-zinc-100" {...getSafeProps(props)}>
    {children}
  </code>
);

// Custom layout components inside MDX (Columns, Card, CardGroup, Icon)
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

export function CardGroup({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-4 my-6`}>
      {children}
    </div>
  );
}

export const img = ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <span className="block my-8 space-y-2 text-center">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="mx-auto max-w-full h-auto rounded-xl border border-white/5 bg-zinc-950/20"
      {...getSafeProps(props)}
    />
    {alt && (
      <span className="block text-xs text-zinc-500 font-sans font-medium">
        {alt}
      </span>
    )}
  </span>
);

import MdxCard from "./MdxCard";

export const Card = MdxCard;

import { Cover } from "./mdx/Cover";
import { AuthorCard } from "./mdx/AuthorCard";
import { WorkflowCard, WorkflowCardGroup } from "./WorkflowCard";

import ProgressFlow from "./diagrams/ProgressFlow";
import StageFlowchart from "./diagrams/StageFlowchart";
import InvoicingFlowchart from "./diagrams/InvoicingFlowchart";
import SequenceDiagram from "./diagrams/SequenceDiagram";
import ProductionBrainAccess from "./diagrams/ProductionBrainAccess";
import ProjectDetailMock from "./diagrams/ProjectDetailMock";
import WorkPackageLifecycle from "./diagrams/WorkPackageLifecycle";
import WorkOrderFlow from "./diagrams/WorkOrderFlow";
import ResourceManagementMock from "./diagrams/ResourceManagementMock";

export function Icon({ icon, size = 16, className }: { icon: string; size?: number; className?: string }) {
  const IconComponent = getIconComponent(icon);
  if (!IconComponent) return null;
  return React.createElement(IconComponent, { size, className });
}

export function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

// Gather all component overrides in a single map
export const mdxComponents = {
  Cover,
  AuthorCard,
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
  img,
  Columns,
  Card,
  CardGroup,
  WorkflowCard,
  WorkflowCardGroup,
  StepCard: WorkflowCard,
  StepCardGroup: WorkflowCardGroup,
  Icon,
  AgentOnly,
  ProgressFlow,
  StageFlowchart,
  InvoicingFlowchart,
  SequenceDiagram,
  ProductionBrainAccess,
  ProjectDetailMock,
  WorkPackageLifecycle,
  WorkOrderFlow,
  ResourceManagementMock,
};
