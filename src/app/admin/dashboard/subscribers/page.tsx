"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Loader2, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Globe,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check
} from "lucide-react";
import { getSubscribers, manualAddSubscriber, checkResendIntegrationStatus, syncResendContacts } from "../../resend-actions";
import { AnimatePresence, motion } from "framer-motion";

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  resend_contact_id: string | null;
  is_marketing_list: boolean;
  is_application_list: boolean;
  status: "subscribed" | "unsubscribed" | "bounced";
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

type SortField = 
  | "email" 
  | "first_name" 
  | "last_name" 
  | "status" 
  | "created_at" 
  | "updated_at" 
  | "resend_contact_id"
  | "membership";

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendStatus, setResendStatus] = useState<{ status: string; message: string }>({
    status: "Checking...",
    message: ""
  });
  const [checkingResend, setCheckingResend] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "marketing" | "application">("all");
  
  // Add Subscriber Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [isMarketingInput, setIsMarketingInput] = useState(true);
  const [isApplicationInput, setIsApplicationInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    checkResend();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    const result = await getSubscribers();
    if (result.success && result.subscribers) {
      setSubscribers(result.subscribers as Subscriber[]);
    } else {
      showToast(result.error || "Failed to load subscribers.", "error");
    }
    setLoading(false);
  };

  const checkResend = async () => {
    setCheckingResend(true);
    const result = await checkResendIntegrationStatus();
    setResendStatus({
      status: result.status,
      message: result.message
    });
    setCheckingResend(false);
  };

  const handleSyncContacts = async () => {
    setSyncingContacts(true);
    showToast("Starting synchronization with Resend...", "info");
    const result = await syncResendContacts();
    if (result.success) {
      showToast(`Synchronized ${result.count} contacts from Resend!`, "success");
      fetchData();
    } else {
      showToast(result.error || "Failed to sync contacts.", "error");
    }
    setSyncingContacts(false);
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitting(true);
    const result = await manualAddSubscriber(
      emailInput,
      firstNameInput,
      lastNameInput,
      isMarketingInput,
      isApplicationInput
    );
    if (result.success) {
      showToast("Subscriber added successfully and synced with Resend!", "success");
      setShowAddModal(false);
      setEmailInput("");
      setFirstNameInput("");
      setLastNameInput("");
      setIsMarketingInput(true);
      setIsApplicationInput(false);
      fetchData();
    } else {
      showToast(result.error || "Failed to add subscriber.", "error");
    }
    setSubmitting(false);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 1. Filtering
  const filteredSubscribers = subscribers.filter((sub) => {
    if (activeTab === "marketing" && !sub.is_marketing_list) return false;
    if (activeTab === "application" && !sub.is_application_list) return false;

    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    const firstName = (sub.first_name || "").toLowerCase();
    const lastName = (sub.last_name || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = sub.email.toLowerCase();
    const resendId = (sub.resend_contact_id || "").toLowerCase();

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      fullName.includes(query) ||
      email.includes(query) ||
      resendId.includes(query)
    );
  });

  // Reset page when filtering criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // 2. Sorting
  const sortedSubscribers = [...filteredSubscribers].sort((a, b) => {
    let valA: any = a[sortField as keyof Subscriber];
    let valB: any = b[sortField as keyof Subscriber];

    if (sortField === "membership") {
      const rank = (sub: Subscriber) => {
        if (sub.is_application_list) return 2;
        if (sub.is_marketing_list) return 1;
        return 0;
      };
      valA = rank(a);
      valB = rank(b);
    }

    if (valA === null || valA === undefined) valA = "";
    if (valB === null || valB === undefined) valB = "";

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // 3. Pagination
  const totalFilteredCount = sortedSubscribers.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);
  const paginatedSubscribers = sortedSubscribers.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  const totalCount = subscribers.length;
  const marketingCount = subscribers.filter((s) => s.is_marketing_list).length;
  const applicationCount = subscribers.filter((s) => s.is_application_list).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "—";
    }
  };

  const renderHeader = (label: string, field: SortField) => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className="py-3.5 px-5 font-bold cursor-pointer hover:bg-white/[0.02] transition-colors select-none group"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0">
            {isSorted ? (
              sortDirection === "asc" ? (
                <ArrowUp className="w-3 h-3 text-white" />
              ) : (
                <ArrowDown className="w-3 h-3 text-white" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-[90rem] mx-auto pb-12">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              Audience Subscribers
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Manage your newsletter audience and monitor connection status with Resend.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Subscriber</span>
          </button>
        </div>

        {/* Segmented Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Total Subscribers</span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1 font-sans">{totalCount}</h2>
            </div>
            <Users className="w-7 h-7 text-zinc-500" />
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Marketing List</span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1 font-sans">{marketingCount}</h2>
            </div>
            <Mail className="w-7 h-7 text-zinc-500" />
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Application List</span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1 font-sans">{applicationCount}</h2>
            </div>
            <Globe className="w-7 h-7 text-zinc-500" />
          </div>
        </div>

        {/* Integration Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Resend Integration Status
              </span>
            </div>
            <button 
              onClick={checkResend}
              disabled={checkingResend}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer font-sans"
            >
              <RefreshCw className={`w-3 h-3 ${checkingResend ? "animate-spin" : ""}`} />
              <span>Verify API</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                resendStatus.status === "Connected" 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {resendStatus.status}
              </span>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {resendStatus.message || "Verifying Resend authorization keys..."}
              </p>
            </div>

            {resendStatus.status === "Connected" && (
              <button
                onClick={handleSyncContacts}
                disabled={syncingContacts || checkingResend}
                className="btn-glass h-8 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans transition-all duration-200"
              >
                {syncingContacts ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync Contacts from Resend</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
          {/* Tab switches */}
          <div className="flex bg-white/[0.02] border border-white/5 p-0.5 rounded-full shrink-0">
            {(["all", "marketing", "application"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer font-sans ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "All Contacts" : tab === "marketing" ? "Marketing List" : "Application List"}
              </button>
            ))}
          </div>

          {/* Search field */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, or Resend ID..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200 font-sans"
              />
            </div>
            <div className="text-[10px] text-zinc-500 font-sans font-medium shrink-0">
              Total: <span className="text-white font-bold">{totalFilteredCount}</span>
            </div>
          </div>
        </div>

        {/* Subscribers Table Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-sans">Querying newsletter audience...</span>
          </div>
        ) : paginatedSubscribers.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl font-sans">
            No subscribers found matching your criteria.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                      {renderHeader("Email Address", "email")}
                      {renderHeader("First Name", "first_name")}
                      {renderHeader("Last Name", "last_name")}
                      {renderHeader("Status", "status")}
                      {renderHeader("Membership", "membership")}
                      {renderHeader("Joined Date", "created_at")}
                      {renderHeader("Last Updated", "updated_at")}
                      {renderHeader("Resend ID", "resend_contact_id")}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {paginatedSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-white truncate max-w-[200px]" title={sub.email}>
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-5 truncate max-w-[120px]">{sub.first_name || "—"}</td>
                        <td className="py-3.5 px-5 truncate max-w-[120px]">{sub.last_name || "—"}</td>
                        <td className="py-3.5 px-5">
                          {sub.status === "subscribed" ? (
                            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-sans">
                              Subscribed
                            </span>
                          ) : sub.status === "unsubscribed" ? (
                            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-zinc-400 font-sans">
                              Unsubscribed
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-950/20 border border-red-500/20 text-red-400 font-sans">
                              Bounced
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sub.is_marketing_list && (
                              <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5 font-sans">
                                Marketing
                              </span>
                            )}
                            {sub.is_application_list && (
                              <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-500/20 font-sans">
                                Application
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[10px] text-zinc-500">
                          {formatDate(sub.created_at)}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[10px] text-zinc-500">
                          {formatDateTime(sub.updated_at)}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
                            <span className="truncate max-w-[120px]">{sub.resend_contact_id || "Simulated Feed"}</span>
                            {sub.resend_contact_id && (
                              <button
                                onClick={() => handleCopy(sub.resend_contact_id!)}
                                className="p-3 sm:p-1 hover:bg-white/5 rounded text-zinc-600 hover:text-zinc-300 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 cursor-pointer"
                                title="Copy Resend Contact ID"
                              >
                                {copiedId === sub.resend_contact_id ? (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-white/5 text-center text-[10px] text-zinc-500 block md:hidden">
                Swipe left/right to scroll the audience ledger.
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/20 border border-white/5 p-4 rounded-2xl font-sans">
                <div className="text-xs text-zinc-500">
                  Showing <span className="text-white font-medium">{startIndex + 1}</span> to{" "}
                  <span className="text-white font-medium">{endIndex}</span> of{" "}
                  <span className="text-white font-medium">{totalFilteredCount}</span> subscribers
                </div>
                
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Prev Page */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Page Numbers */}
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-600 text-xs select-none min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`w-11 h-11 sm:w-8 sm:h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] ${
                          isActive
                            ? "bg-white text-black font-bold shadow-md shadow-white/5"
                            : "border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Subscriber Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-2xl border border-white/5 glass-panel relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-sm font-bold text-white tracking-tight font-sans flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-zinc-400" />
                  Add New Subscriber
                </h3>
                <form onSubmit={handleAddSubscriber} className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">First Name</label>
                      <input
                        type="text"
                        value={firstNameInput}
                        onChange={(e) => setFirstNameInput(e.target.value)}
                        placeholder="e.g. John"
                        className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Last Name</label>
                      <input
                        type="text"
                        value={lastNameInput}
                        onChange={(e) => setLastNameInput(e.target.value)}
                        placeholder="e.g. Doe"
                        className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                      />
                    </div>
                  </div>
                  
                  {/* List Membership Selection */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-2">
                      List Membership
                    </label>
                    <div className="space-y-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMarketingInput}
                          onChange={(e) => {
                            if (!e.target.checked && isApplicationInput) return; // Forced true if App is checked
                            setIsMarketingInput(e.target.checked);
                          }}
                          className="rounded border-white/10 bg-white/[0.03] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">Marketing List</span>
                          <span className="text-[10px] text-zinc-500">Subscribes to updates, announcements, and newsletters.</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer border-t border-white/5 pt-2.5">
                        <input
                          type="checkbox"
                          checked={isApplicationInput}
                          onChange={(e) => {
                            setIsApplicationInput(e.target.checked);
                            if (e.target.checked) {
                              setIsMarketingInput(true);
                            }
                          }}
                          className="rounded border-white/10 bg-white/[0.03] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">Application List</span>
                          <span className="text-[10px] text-zinc-500">Identifies users signed up to use the core application.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Register Contact</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-3rem)] pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="pointer-events-auto w-full p-4 rounded-xl border glass-panel flex items-start gap-3 shadow-2xl"
              >
                {toast.type === "success" ? (
                  <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white break-words font-sans">{toast.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
