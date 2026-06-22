"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Loader2, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Globe
} from "lucide-react";
import { getSubscribers, manualAddSubscriber, checkResendIntegrationStatus } from "../../resend-actions";
import { AnimatePresence, motion } from "framer-motion";

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  resend_contact_id: string | null;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

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
  
  // Add Subscriber Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitting(true);
    const result = await manualAddSubscriber(emailInput, firstNameInput, lastNameInput);
    if (result.success) {
      showToast("Subscriber added successfully and synced with Resend!", "success");
      setShowAddModal(false);
      setEmailInput("");
      setFirstNameInput("");
      setLastNameInput("");
      fetchData();
    } else {
      showToast(result.error || "Failed to add subscriber.", "error");
    }
    setSubmitting(false);
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const nameMatch = 
      (sub.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (sub.last_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

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
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200 font-sans"
            />
          </div>
          <div className="text-[10px] text-zinc-500 font-sans font-medium">
            Total Tracks: <span className="text-white font-bold">{filteredSubscribers.length}</span>
          </div>
        </div>

        {/* Subscribers Table Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-sans">Querying newsletter audience...</span>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl font-sans">
            No subscribers found in your audience.
          </div>
        ) : (
          <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 bg-zinc-950/40">
                    <th className="py-3.5 px-5 font-bold">Email Address</th>
                    <th className="py-3.5 px-5 font-bold">First Name</th>
                    <th className="py-3.5 px-5 font-bold">Last Name</th>
                    <th className="py-3.5 px-5 font-bold">Joined Date</th>
                    <th className="py-3.5 px-5 font-bold">Resend ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-white truncate max-w-[200px]">{sub.email}</td>
                      <td className="py-3.5 px-5 truncate max-w-[120px]">{sub.first_name || "—"}</td>
                      <td className="py-3.5 px-5 truncate max-w-[120px]">{sub.last_name || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-[10px] text-zinc-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[9px] text-zinc-500 truncate max-w-[150px]">
                        {sub.resend_contact_id || "Simulated Feed"}
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
                className="w-full max-w-md p-6 rounded-2xl border border-white/5 glass-panel relative z-10 space-y-4"
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
