"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  X, 
  Loader2, 
  ArrowRight, 
  ChevronRight, 
  Compass, 
  Users, 
  ClipboardList, 
  FolderKanban, 
  Calendar, 
  CreditCard, 
  Plug, 
  HelpCircle,
  CornerDownLeft,
  FileText
} from "lucide-react";
import { Document } from "flexsearch";

interface SearchRecord {
  slug: string;
  title: string;
  description: string;
  content: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-white/10 text-white px-0.5 rounded-sm font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function getSnippet(content: string, query: string): string {
  if (!query) return content.slice(0, 120) + "...";
  
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return content.slice(0, 120) + "...";
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 70);
  
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  
  return snippet;
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const indexRef = useRef<Document<SearchRecord> | null>(null);
  const recordsRef = useRef<SearchRecord[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener for '/' to focus inline search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch search index on focus or mount
  const ensureIndexLoaded = () => {
    if (indexLoaded || isLoading) return;
    
    setIsLoading(true);
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchRecord[]) => {
        recordsRef.current = data;
        
        const index = new Document<SearchRecord>({
          document: {
            id: "slug",
            index: ["title", "description", "content"],
            store: ["title", "description", "slug", "content"]
          },
          tokenize: "forward",
          resolution: 9,
          cache: true
        });
        
        data.forEach((record) => {
          index.add(record.slug, record);
        });
        
        indexRef.current = index;
        setIndexLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load search index:", err);
        setIsLoading(false);
      });
  };

  // Perform search query
  useEffect(() => {
    if (!indexLoaded || !indexRef.current || !query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    
    const searchVal = query.trim();
    const searchResults = indexRef.current.search(searchVal, 8, { enrich: true });
    const matchedDocsMap = new Map<string, { doc: SearchRecord; score: number }>();
    
    searchResults.forEach((fieldResult) => {
      const fieldName = fieldResult.field;
      const weight = fieldName === "title" ? 10 : fieldName === "description" ? 5 : 1;
      
      fieldResult.result.forEach((item) => {
        const doc = item.doc;
        const existing = matchedDocsMap.get(doc.slug);
        if (existing) {
          existing.score += weight;
        } else {
          matchedDocsMap.set(doc.slug, { doc, score: weight });
        }
      });
    });
    
    const sorted = Array.from(matchedDocsMap.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.doc);
      
    setResults(sorted);
    setSelectedIndex(0);
  }, [query, indexLoaded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (query.trim() === "") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const nextIdx = prev < results.length - 1 ? prev + 1 : prev;
        scrollSelectedIntoView(nextIdx);
        return nextIdx;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const nextIdx = prev > 0 ? prev - 1 : prev;
        scrollSelectedIntoView(nextIdx);
        return nextIdx;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleNavigate(results[selectedIndex].slug);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    const container = resultsContainerRef.current;
    if (!container) return;
    
    const elements = container.getElementsByClassName("inline-search-result-item");
    const element = elements[index] as HTMLElement;
    if (!element) return;
    
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = element.offsetTop;
    const elemBottom = elemTop + element.clientHeight;
    
    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  };

  const handleNavigate = (slug: string) => {
    setQuery("");
    const targetUrl = slug === "index" || slug === "" ? "/docs" : `/docs/${slug}`;
    router.push(targetUrl);
  };

  // Quick topics definition
  const quickTopics = [
    { label: "Onboarding", query: "onboarding" },
    { label: "Brief Analyzer", query: "brief analyzer" },
    { label: "Stripe Setup", query: "stripe setup" },
    { label: "Slack Sync", query: "slack notifications" },
    { label: "FAQs", query: "faqs" }
  ];

  // 8 main chapters definition
  const chapters = [
    {
      title: "Introduction & Concepts",
      icon: Compass,
      desc: "Understand workspace roles, platform workflows, and collaboration capabilities.",
      links: [
        { label: "Navigation Guide", href: "/docs/user-guide/0.0-agent-and-human-navigation-guide" },
        { label: "Glossary & Acronyms", href: "/docs/user-guide/0.1-glossary-and-acronyms" },
        { label: "Order of Operations", href: "/docs/user-guide/0.2-order-of-operations" },
        { label: "System Capabilities", href: "/docs/user-guide/0.3-ai-capabilities-and-copilot" }
      ]
    },
    {
      title: "Setup & Team",
      icon: Users,
      desc: "Manage profile settings, custom intake forms, and team permissions.",
      links: [
        { label: "Signing In & Onboarding", href: "/docs/user-guide/1.1-signing-in-and-onboarding" },
        { label: "Setting Up Your Profile", href: "/docs/user-guide/1.2-setting-up-your-profile" },
        { label: "Org Setup & Custom Forms", href: "/docs/user-guide/1.3-organization-setup-and-custom-forms" },
        { label: "Permissions & Teams", href: "/docs/user-guide/1.4-team-management-and-permissions" }
      ]
    },
    {
      title: "Project Intake & Scoping",
      icon: ClipboardList,
      desc: "Create project scopes manually or analyze client brief milestones.",
      links: [
        { label: "Brief Analyzer", href: "/docs/user-guide/2.1-ai-brief-analyzer" },
        { label: "Manual Project Scoping", href: "/docs/user-guide/2.2-manual-project-creation" },
        { label: "Custom Client Intake", href: "/docs/user-guide/2.3-custom-intake-forms" }
      ]
    },
    {
      title: "Projects & Resources",
      icon: FolderKanban,
      desc: "Track active milestones, task lists, and shared equipment logs.",
      links: [
        { label: "Master Project Detail", href: "/docs/user-guide/3.1-master-project-detail-overview" },
        { label: "Work Packages & Milestones", href: "/docs/user-guide/3.2-work-packages-and-milestones" },
        { label: "Work Orders & Agreements", href: "/docs/user-guide/3.3-work-orders-and-agreements" },
        { label: "Task List & Scheduling", href: "/docs/user-guide/3.4-task-lists-and-tracking" }
      ]
    },
    {
      title: "Crewing & Scheduling",
      icon: Calendar,
      desc: "Match available talent and synchronize calendar utilization.",
      links: [
        { label: "Internal Talent Search", href: "/docs/user-guide/4.1-internal-talent-search" },
        { label: "Matchmaking Suggestions", href: "/docs/user-guide/4.2-ai-matchmaking-suggestions" },
        { label: "Invite & Crew RSVP", href: "/docs/user-guide/4.3-inviting-and-crew-rsvp" },
        { label: "Utilization Calendar", href: "/docs/user-guide/4.4-managing-your-utilization-calendar" }
      ]
    },
    {
      title: "Payments & Financials",
      icon: CreditCard,
      desc: "Configure Stripe routing, manage invoicing, and track billing ledgers.",
      links: [
        { label: "Freelancer Stripe Setup", href: "/docs/user-guide/5.1-freelancer-stripe-setup" },
        { label: "Invoicing & Payouts", href: "/docs/user-guide/5.2-invoicing-and-payouts" },
        { label: "Billing & Credits", href: "/docs/user-guide/5.3-billing-ledger-and-ai-credits" },
        { label: "Billing & Platform Fees", href: "/docs/user-guide/5.4-billing-and-payments" }
      ]
    },
    {
      title: "Integrations",
      icon: Plug,
      desc: "Connect Slack and Frame.io workspaces to unify system collaboration.",
      links: [
        { label: "Slack Notifications Setup", href: "/docs/user-guide/6.1-slack-notifications" },
        { label: "Frame.io Workspaces", href: "/docs/user-guide/6.2-frameio-workspaces" },
        { label: "Project File Sharing", href: "/docs/user-guide/6.3-project-collaboration-and-file-sharing" }
      ]
    },
    {
      title: "FAQs & Support",
      icon: HelpCircle,
      desc: "Find quick answers and troubleshoot platform configurations.",
      links: [
        { label: "Frequently Asked Questions", href: "/docs/user-guide/7.1-faqs-and-troubleshooting" },
        { label: "Troubleshooting Guide", href: "/docs/user-guide/7.1-faqs-and-troubleshooting#troubleshooting" }
      ]
    }
  ];

  return (
    <div className="space-y-10 py-4 md:py-8 max-w-5xl mx-auto selection:bg-neutral-800 selection:text-white">
      
      {/* Hero Header Section - Clean & Neutral */}
      <section className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/5 bg-white/3 text-neutral-400 text-[10px] font-medium tracking-wide font-sans">
          Documentation
        </div>
        
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 leading-tight">
          How can we help?
        </h1>
        
        <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
          Explore configuration guides, workspace setup, project scoping, talent matching, and secure ledger integration.
        </p>
      </section>

      {/* Main Search Input & Live Results Hub - Minimalist Dark Glass */}
      <section className="max-w-xl mx-auto relative space-y-3">
        {/* Input Bar */}
        <div 
          className={`relative flex items-center rounded-full bg-neutral-950/20 border transition-all duration-200 ${
            isFocused 
              ? "border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.03)] bg-neutral-950/70" 
              : "border-white/5 hover:border-neutral-800 bg-neutral-950/15"
          }`}
        >
          <div className="pl-4 pr-2 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
            ) : (
              <Search className={`h-4 w-4 transition-colors ${isFocused ? "text-neutral-300" : "text-neutral-500"}`} />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent py-3 text-xs text-neutral-200 placeholder-neutral-500 outline-none select-text"
            placeholder="Search documentation (Press '/' to focus)..."
            value={query}
            onFocus={() => {
              setIsFocused(true);
              ensureIndexLoaded();
            }}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 mr-3 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Clear query"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {!query && (
            <div className="absolute right-4 hidden sm:flex items-center gap-1 select-none pointer-events-none">
              <kbd className="inline-flex items-center rounded border border-white/5 bg-neutral-900 px-1 py-0.5 font-sans text-[8px] text-neutral-500">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Quick Search Tag Bubbles */}
        {query.trim() === "" && (
          <div className="flex flex-wrap justify-center items-center gap-1.5 pt-0.5">
            <span className="text-[9px] text-neutral-600 font-medium mr-1 uppercase tracking-wider font-sans">Popular:</span>
            {quickTopics.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  ensureIndexLoaded();
                  setQuery(item.query);
                  inputRef.current?.focus();
                }}
                className="rounded-full bg-white/3 hover:bg-white/8 border border-white/3 px-2.5 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 transition-all duration-150 cursor-pointer font-sans"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Live Search Results View Container */}
        {query.trim() !== "" && (
          <div 
            ref={resultsContainerRef}
            className="w-full rounded-xl glass-panel border border-white/5 p-1.5 max-h-[50vh] overflow-y-auto space-y-0.5 z-10 shadow-2xl relative"
            data-lenis-prevent
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                <span className="text-[10px] font-sans text-neutral-500">Indexing guides...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                <p className="text-xs">No matching guides found for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-[9px] text-neutral-500 uppercase font-heading font-semibold tracking-wider px-2.5 py-1.5 border-b border-white/5 mb-1">
                  <span>Search Matches ({results.length})</span>
                  <span className="hidden sm:inline font-sans font-normal lowercase tracking-normal text-neutral-600">Use arrow keys to navigate</span>
                </div>
                {results.map((record, index) => {
                  const isSelected = index === selectedIndex;
                  const sectionTag = record.slug.includes("/") 
                    ? record.slug.split("/")[0].replace(/-/g, " ") 
                    : "general";
                    
                  return (
                    <button
                      key={record.slug}
                      onClick={() => handleNavigate(record.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`inline-search-result-item w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-all duration-100 border cursor-pointer ${
                        isSelected 
                          ? "bg-white/5 border-white/5 pl-3 border-l-2 border-l-white/60"
                          : "bg-transparent border-transparent pl-2.5"
                      }`}
                    >
                      <FileText className={`h-4 w-4 shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "text-neutral-200" : "text-neutral-500"
                      }`} />
                      <div className="flex-1 min-w-0 font-sans">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[8px] font-bold uppercase tracking-wider transition-colors ${
                            isSelected ? "text-neutral-300" : "text-neutral-500"
                          }`}>
                            {sectionTag}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[8px] text-neutral-500 font-sans font-medium">
                              Select <CornerDownLeft className="h-2 w-2" />
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-semibold transition-colors mt-0.5 ${
                          isSelected ? "text-white" : "text-neutral-300"
                        }`}>
                          <HighlightedText text={record.title} highlight={query} />
                        </h4>
                        {record.description && (
                          <p className={`text-[11px] transition-colors mt-0.5 line-clamp-1 ${
                            isSelected ? "text-neutral-300" : "text-neutral-400"
                          }`}>
                            <HighlightedText text={record.description} highlight={query} />
                          </p>
                        )}
                        <p className={`text-[10px] transition-colors mt-1 line-clamp-2 leading-relaxed ${
                          isSelected ? "text-neutral-400" : "text-neutral-500"
                        }`}>
                          <HighlightedText 
                            text={getSnippet(record.content, query)} 
                            highlight={query} 
                          />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main content conditional view */}
      {query.trim() === "" && (
        <div className="space-y-10">
          
          {/* Timeline Onboarding Block - Popular Workflows */}
          <section className="space-y-3">
            <h2 className="font-heading text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
              <span className="h-0.5 w-6 bg-neutral-600 rounded-full"></span>
              Getting Started Workflows
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  step: "01",
                  title: "Workspace Setup",
                  desc: "Complete member onboarding & configure custom client intake forms.",
                  link: "/docs/user-guide/1.1-signing-in-and-onboarding",
                  tag: "Setup"
                },
                {
                  step: "02",
                  title: "Project Scoping",
                  desc: "Utilize the brief analyzer to generate project scope milestones.",
                  link: "/docs/user-guide/2.1-ai-brief-analyzer",
                  tag: "Scoping"
                },
                {
                  step: "03",
                  title: "Talent Crewing",
                  desc: "Match available crew using recommendations and track calendar RSVP.",
                  link: "/docs/user-guide/4.1-internal-talent-search",
                  tag: "Crewing"
                },
                {
                  step: "04",
                  title: "Stripe Routing",
                  desc: "Connect accounts for secure, automated payments via escrow ledger.",
                  link: "/docs/user-guide/5.1-freelancer-stripe-setup",
                  tag: "Payments"
                }
              ].map((flow) => (
                <Link
                  href={flow.link}
                  key={flow.step}
                  className="group relative flex flex-col justify-between rounded-xl glass-panel p-4 border border-white/3 hover:bg-neutral-900/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-neutral-600 font-sans tracking-wide">STEP {flow.step}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/3 text-neutral-500 font-sans border border-white/3">
                        {flow.tag}
                      </span>
                    </div>
                    
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-neutral-200">
                      {flow.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                      {flow.desc}
                    </p>
                  </div>
                  
                  <div className="pt-3 flex items-center justify-end text-[9px] font-bold text-neutral-500 group-hover:text-white transition-colors gap-0.5 font-sans">
                    Read Guide
                    <ChevronRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Grid Directory representing 8 chapters */}
          <section className="space-y-3">
            <h2 className="font-heading text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
              <span className="h-0.5 w-6 bg-neutral-600 rounded-full"></span>
              Explore All Chapters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chapters.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.title}
                    className="rounded-xl glass-panel border border-white/3 p-5 space-y-3 hover:border-white/5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-neutral-400 shrink-0" />
                        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-200">
                          {ch.title}
                        </h3>
                      </div>
                      
                      <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                        {ch.desc}
                      </p>
                    </div>

                    {/* Populated direct subpages list */}
                    <div className="pt-2.5 border-t border-white/3 space-y-2">
                      <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider font-sans">Guides:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                        {ch.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="inline-flex items-center text-[11px] text-neutral-400 hover:text-white group transition-colors font-sans"
                          >
                            <ChevronRight className="h-2.5 w-2.5 text-neutral-600 group-hover:text-neutral-400 transition-colors shrink-0 mr-1" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
        </div>
      )}
    </div>
  );
}
