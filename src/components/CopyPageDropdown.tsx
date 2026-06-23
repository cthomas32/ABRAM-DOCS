"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, FileText, Check, ChevronDown, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CopyPageDropdownProps {
  title: string;
  description?: string;
  rawMdx: string;
  className?: string;
}

// Helper to strip MDX tags, frontmatter, and other code elements to produce clean text
function stripMdxToPlainText(mdx: string, title: string, description?: string): string {
  let text = mdx;

  // 1. Remove frontmatter (if it starts with ---)
  if (text.startsWith("---")) {
    const nextDashIndex = text.indexOf("---", 3);
    if (nextDashIndex !== -1) {
      text = text.substring(nextDashIndex + 3);
    }
  }

  // 1.5. Remove AgentOnly component blocks completely (including their content)
  text = text.replace(/<AgentOnly(?:\s+[^>]*?)?>[\s\S]*?<\/AgentOnly>/gi, "");

  // 2. Remove MDX React imports or specific MDX constructs
  text = text.replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, "");

  // 3. Remove custom MDX components (opening, closing, and self-closing tags)
  // Handles <CardGroup>, <Card ...>, </Card>, etc.
  text = text.replace(/<[A-Za-z0-9_]+(?:\s+[^>]*?)?>/g, "");
  text = text.replace(/<\/[A-Za-z0-9_]+>/g, "");

  // 4. Simplify markdown links [Label](url) -> Label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5. Remove bold, italic, strikethrough formatting
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/(~~)(.*?)\1/g, "$2");

  // 6. Clean up headers (e.g. ## Header -> Header)
  text = text.replace(/^#{1,6}\s+(.*)$/gm, "$1");

  // 7. Clean up code blocks and inline code
  text = text.replace(/```[a-z]*\n([\s\S]*?)\n```/g, "$1");
  text = text.replace(/`([^`]+)`/g, "$1");

  // 8. Clean up extra empty lines
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  // 9. Format output with Title and Description at the top
  const header = `${title}\n${description ? `${description}\n` : ""}\n========================================\n\n`;
  return header + text;
}

// Helper to format MDX for LLMs/Agents (preserves markdown structure, adds clear context tags)
function formatMdxForAgents(mdx: string, title: string, description?: string): string {
  let content = mdx;
  // Ensure frontmatter is preserved or formatted clearly
  if (!content.startsWith("---")) {
    const frontmatter = `---\ntitle: ${title}\n${description ? `description: ${description}\n` : ""}---\n\n`;
    content = frontmatter + content;
  }
  
  // Wrap in clear systemic metadata tags so agents understand the context instantly
  const agentWrapper = `<!-- DOCUMENT_START -->
<!-- Metadata:
Title: ${title}
Description: ${description || "None"}
-->
${content.trim()}
<!-- DOCUMENT_END -->`;

  return agentWrapper;
}

export default function CopyPageDropdown({ title, description, rawMdx, className }: CopyPageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<"page" | "md" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyPage = async () => {
    const plainText = stripMdxToPlainText(rawMdx, title, description);
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedType("page");
      setIsOpen(false);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy page content: ", err);
    }
  };

  const handleCopyMd = async () => {
    const agentMd = formatMdxForAgents(rawMdx, title, description);
    try {
      await navigator.clipboard.writeText(agentMd);
      setCopiedType("md");
      setIsOpen(false);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy markdown content: ", err);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className || ""}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition duration-200 cursor-pointer select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {copiedType ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span>{copiedType ? "Copied!" : "Copy page"}</span>
        <ChevronDown
          className={`h-3 w-3 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-1 w-64 origin-top-right rounded-lg bg-zinc-950/95 backdrop-blur-[32px] border border-white/5 p-1 shadow-xl z-50"
          >
            {/* Copy Page Option */}
            <button
              onClick={handleCopyPage}
              className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <FileText className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Copy page
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Copy reader-friendly plain text format
                </div>
              </div>
            </button>

            {/* Copy MD for Agents Option */}
            <button
              onClick={handleCopyMd}
              className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer group border-t border-zinc-100 dark:border-zinc-900 mt-1 pt-1.5"
            >
              <Bot className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Copy MD for agents
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Copy formatted Markdown structure optimized for LLMs
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
