"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CornerDownLeft, FileText, Loader2 } from "lucide-react";
import { Document } from "flexsearch";

interface SearchRecord {
  slug: string;
  title: string;
  description: string;
  content: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
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
          <mark key={i} className="bg-abram-purple/35 text-purple-300 px-0.5 rounded-sm font-semibold">
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
  if (!query) return content.slice(0, 150) + "...";
  
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return content.slice(0, 150) + "...";
  }
  
  const start = Math.max(0, index - 60);
  const end = Math.min(content.length, index + query.length + 90);
  
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  
  return snippet;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  
  const indexRef = useRef<Document<SearchRecord> | null>(null);
  const recordsRef = useRef<SearchRecord[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load and build search index when modal is opened
  useEffect(() => {
    if (!isOpen) return;
    
    // Auto-focus input when opened
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    if (indexLoaded) return;
    
    let active = true;
    
    // Set loading state asynchronously to avoid warning
    Promise.resolve().then(() => {
      if (active) {
        setIsLoading(true);
      }
    });
    
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchRecord[]) => {
        if (!active) return;
        recordsRef.current = data;
        
        // Initialize FlexSearch Document Index
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
        
        // Add records to index
        data.forEach((record) => {
          index.add(record.slug, record);
        });
        
        indexRef.current = index;
        setIndexLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load search index:", err);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, indexLoaded]);

  // Perform search query
  useEffect(() => {
    if (!indexLoaded || !indexRef.current || !query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    
    const searchVal = query.trim();
    
    // FlexSearch document search
    const searchResults = indexRef.current.search(searchVal, 10, { enrich: true });
    
    // Merge results across index fields and deduplicate by slug
    const matchedDocsMap = new Map<string, { doc: SearchRecord; score: number }>();
    
    searchResults.forEach((fieldResult) => {
      const fieldName = fieldResult.field; // "title", "description", or "content"
      // Weighted scores: matches in title carry the most relevance
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
    
    // Sort by combined score
    const sorted = Array.from(matchedDocsMap.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.doc);
      
    setResults(sorted);
    setSelectedIndex(0);
  }, [query, indexLoaded]);

  // Handle ESC shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const scrollSelectedIntoView = (index: number) => {
    const container = resultsContainerRef.current;
    if (!container) return;
    
    const elements = container.getElementsByClassName("search-result-item");
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    }
  };

  const handleNavigate = (slug: string) => {
    onClose();
    setQuery("");
    
    // Build target URL
    const targetUrl = slug === "index" || slug === "" ? "/docs" : `/docs/${slug}`;
    router.push(targetUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[12vh] sm:p-6 sm:pt-[15vh]">
        <div 
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl glass-panel shadow-2xl transition-all duration-300 border border-border"
          onKeyDown={handleKeyDown}
        >
          {/* Header Input */}
          <div className="relative border-b border-border/60">
            <Search className="absolute left-4 top-4.5 h-5 w-5 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent py-4 pl-12 pr-12 text-sm text-zinc-200 placeholder-zinc-500 outline-none"
              placeholder="Search documentation (use arrow keys to navigate)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-4 top-4 p-0.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!query && (
              <span className="absolute right-4 top-4.5 rounded border border-border bg-zinc-900 px-1.5 py-0.5 font-sans text-[9px] text-zinc-500">
                ESC
              </span>
            )}
          </div>
          
          {/* Search Content */}
          <div 
            ref={resultsContainerRef}
            className="max-h-[60vh] overflow-y-auto p-2"
            data-lenis-prevent
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                <span className="text-xs">Initializing search index...</span>
              </div>
            ) : query.trim() === "" ? (
              <div className="py-6 px-4 text-center">
                <div className="text-xs text-zinc-500 uppercase font-sans font-semibold tracking-wider mb-4 text-left px-2">
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {["introduction", "workspace", "billing", "contractor", "payments"].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-border px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer font-sans"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 text-left mt-6 px-2">
                  Type a query to search both titles and body text of the documentation.
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-zinc-600 mt-2">Try adjusting your keywords or search terms.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold tracking-wider px-3 py-1">
                  Search Results ({results.length})
                </div>
                {results.map((record, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={record.slug}
                      onClick={() => handleNavigate(record.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`search-result-item w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border cursor-pointer ${
                        isSelected 
                          ? "bg-white/5 border-border/80 pl-4 border-l-2 border-l-white"
                          : "bg-transparent border-transparent pl-3"
                      }`}
                    >
                      <FileText className={`h-4.5 w-4.5 shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "text-zinc-200" : "text-zinc-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}>
                            {record.slug.split("/")[0] || "General"}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-sans">
                              Select <CornerDownLeft className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm font-semibold transition-colors mt-0.5 ${
                          isSelected ? "text-white" : "text-zinc-300"
                        }`}>
                          <HighlightedText text={record.title} highlight={query} />
                        </h4>
                        {record.description && (
                          <p className={`text-xs transition-colors mt-0.5 line-clamp-1 ${
                            isSelected ? "text-zinc-300" : "text-zinc-400"
                          }`}>
                            <HighlightedText text={record.description} highlight={query} />
                          </p>
                        )}
                        <p className={`text-xs transition-colors mt-1 line-clamp-2 leading-relaxed ${
                          isSelected ? "text-zinc-400" : "text-zinc-500"
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
          
          {/* Footer controls */}
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5 bg-zinc-950/20 text-[10px] text-zinc-500 font-sans">
            <div className="flex gap-4">
              <span>
                <kbd className="bg-zinc-900 border border-border px-1 py-0.5 rounded mr-1">↑↓</kbd>
                Navigate
              </span>
              <span>
                <kbd className="bg-zinc-900 border border-border px-1 py-0.5 rounded mr-1">Enter</kbd>
                Open
              </span>
            </div>
            <span>
              <kbd className="bg-zinc-900 border border-border px-1 py-0.5 rounded mr-1">ESC</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
