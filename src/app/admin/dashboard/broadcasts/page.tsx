"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Globe,
  Send,
  BarChart2,
  ChevronRight,
  AlertCircle,
  Check
} from "lucide-react";
import { 
  getCampaigns, 
  createManualDraftCampaign, 
  approveAndSendCampaignAction,
  checkResendIntegrationStatus,
  getCampaignLogs
} from "../../resend-actions";
import { AnimatePresence, motion } from "framer-motion";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string | null;
  html_content: string | null;
  text_content: string | null;
  segment_id: string | null;
  resend_broadcast_id: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipients_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: any | null;
}

interface CampaignLog {
  id: string;
  campaign_id: string;
  subscriber_id: string | null;
  status: "sent" | "delivered" | "failed" | "opened" | "clicked";
  error_message: string | null;
  event_type: string | null;
  recipient_email: string;
  sent_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const TEMPLATES = [
  {
    id: "editorial",
    name: "Editorial / Blog Post Announcement",
    description: "Classic ABRAM styling with header logo image, title, description body, compact cream CTA button, and standard gray links.",
    subject: "Update: New Release & Insights from ABRAM",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ABRAM Update</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 40px;">
              <img src="https://pgcsqnmegfinpzzeftug.supabase.co/storage/v1/object/public/organization-logos/ABRAM_Lockup_Cream@300x.png" alt="ABRAM" width="130" style="display:block;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 0 16px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                Our Latest Update
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 0 32px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#888888; text-align:left;">
                Write your announcement body here. Customize this layout to share news, insights, or blog updates with your subscribers.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:9999px;">
                    <a href="https://abram.network" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.2px;">
                      Read Full Story
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 0 0; border-top: 1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You are receiving this because you subscribed to updates from ABRAM.<br>
                Thomas Abram, Inc. • Washington, DC • <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888888;text-decoration:underline;">Unsubscribe</a> from this list.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `ABRAM Update\n\nOur Latest Update\n\nWrite your announcement body here.\n\nRead full story: https://abram.network\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`
  },
  {
    id: "changelog",
    name: "Release Updates / Changelog",
    description: "Bordered light-blue version pill badge, styled list items, solid white CTA button, and flat deep-black layout.",
    subject: "Release Notes: ABRAM Network v1.0.0 Update",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Changelog Update</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 40px;">
              <img src="https://pgcsqnmegfinpzzeftug.supabase.co/storage/v1/object/public/organization-logos/ABRAM_Lockup_Cream@300x.png" alt="ABRAM" width="130" style="display:block;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Version Badge -->
          <tr>
            <td align="center" style="padding:0 0 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border:1px solid rgba(255,255,255,0.15);border-radius:9999px;padding:4px 12px;background-color:rgba(255,255,255,0.04);vertical-align:middle;text-align:center;line-height:12px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8ECAFF;line-height:12px;display:inline-block;vertical-align:middle;">
                      Version 1.0.0
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 0 16px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                Changelog: What's New
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 0 32px;">
              <div style="font-size:15px;line-height:1.6;color:#888888;text-align:left;">
                <p style="margin:0 0 12px;">Here are the updates pushed in our latest deployment:</p>
                <ul style="padding-left:20px;margin:12px 0;color:#888888;">
                  <li style="margin-bottom:8px;"><strong style="color:#ffffff;font-weight:600;">New Feature</strong>: Write feature explanation here.</li>
                  <li style="margin-bottom:8px;"><strong style="color:#ffffff;font-weight:600;">Performance Boost</strong>: Outline optimization improvements.</li>
                  <li style="margin-bottom:8px;"><strong style="color:#ffffff;font-weight:600;">Bug Fixes</strong>: Resolve minor layout bugs.</li>
                </ul>
              </div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:9999px;">
                    <a href="https://abram.network/changelog" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.2px;">
                      View Full Changelog
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 0 0; border-top: 1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You are receiving this because you subscribed to updates from ABRAM.<br>
                Thomas Abram, Inc. • Washington, DC • <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888888;text-decoration:underline;">Unsubscribe</a> from this list.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `ABRAM Release Notes\n\nVersion 1.0.0 - Changelog: What's New\n\n- New Feature: Write feature explanation.\n- Performance Boost: Outline optimizations.\n- Bug Fixes: Minor fixes.\n\nView Full Changelog: https://abram.network/changelog\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`
  },
  {
    id: "minimal",
    name: "Minimal Text / Standard Update",
    description: "Simple, content-focused template aligned to ABRAM's flat deep-black brand aesthetics.",
    subject: "Quick Update from ABRAM Team",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Update</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 40px;">
              <img src="https://pgcsqnmegfinpzzeftug.supabase.co/storage/v1/object/public/organization-logos/ABRAM_Lockup_Cream@300x.png" alt="ABRAM" width="130" style="display:block;height:auto;border:0;" />
            </td>
          </tr>
          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 0 16px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                ABRAM News
              </h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:0 0 32px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#888888; text-align:left;">
                Hello {{{first_name}}},
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#888888; text-align:left;">
                Write your message here. This template uses a brand-aligned dark background and light text optimized for readability and compliance with the ABRAM brand system.
              </p>
              <p style="margin:0; font-size:15px; line-height:1.6; color:#888888; text-align:left;">
                Best regards,<br>
                The ABRAM Team
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 0 0; border-top: 1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You are receiving this because you subscribed to updates from ABRAM.<br>
                Thomas Abram, Inc. • Washington, DC • <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888888;text-decoration:underline;">Unsubscribe</a> from this list.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `Quick Update from ABRAM Team\n\nHello {{{first_name}}},\n\nWrite your message here.\n\nBest regards,\nThe ABRAM Team\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`
  }
];

export default function BroadcastsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [checkingResend, setCheckingResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ status: string; message: string }>({
    status: "Checking...",
    message: ""
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [segmentIdInput, setSegmentIdInput] = useState("");
  const [htmlContentInput, setHtmlContentInput] = useState("");
  const [textContentInput, setTextContentInput] = useState("");
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Safety Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [approving, setApproving] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");

  useEffect(() => {
    fetchCampaignData();
    checkResend();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchLogsForCampaign(selectedCampaign.id);
    } else {
      setLogs([]);
    }
  }, [selectedCampaign]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchCampaignData = async () => {
    setLoadingCampaigns(true);
    const result = await getCampaigns();
    if (result.success && result.campaigns) {
      setCampaigns(result.campaigns as Campaign[]);
      // Preserve or set active selection
      if (selectedCampaign) {
        const updated = (result.campaigns as Campaign[]).find((c) => c.id === selectedCampaign.id);
        if (updated) setSelectedCampaign(updated);
      }
    } else {
      showToast(result.error || "Failed to load campaigns.", "error");
    }
    setLoadingCampaigns(false);
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

  const fetchLogsForCampaign = async (campaignId: string) => {
    setLoadingLogs(true);
    const result = await getCampaignLogs(campaignId);
    if (result.success && result.logs) {
      setLogs(result.logs as CampaignLog[]);
    } else {
      showToast(result.error || "Failed to load campaign logs.", "error");
    }
    setLoadingLogs(false);
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSubjectInput(template.subject);
      setHtmlContentInput(template.html);
      setTextContentInput(template.text);
      showToast(`Applied ${template.name} template!`, "info");
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !subjectInput || !htmlContentInput || !textContentInput) {
      showToast("Please complete all required fields.", "error");
      return;
    }
    
    setSubmittingBroadcast(true);
    const result = await createManualDraftCampaign(
      titleInput,
      subjectInput,
      textContentInput,
      htmlContentInput,
      segmentIdInput || undefined
    );

    if (result.success) {
      showToast("Campaign draft created! Please review and approve it from the ledger.", "success");
      setShowComposeModal(false);
      setTitleInput("");
      setSubjectInput("");
      setSegmentIdInput("");
      setHtmlContentInput("");
      setTextContentInput("");
      fetchCampaignData();
    } else {
      const errorMsg = (result as { error?: string; message?: string }).error || (result as { error?: string; message?: string }).message || "Failed to create campaign draft.";
      showToast(errorMsg, "error");
    }
    setSubmittingBroadcast(false);
  };

  const handleApproveAndSend = async () => {
    if (!selectedCampaign || confirmInput !== "CONFIRM SEND") return;
    setApproving(true);
    const result = await approveAndSendCampaignAction(selectedCampaign.id, confirmInput);
    if (result.success) {
      showToast("Campaign approved and successfully dispatched!", "success");
      setShowConfirmModal(false);
      setConfirmInput("");
      fetchCampaignData();
    } else {
      const errorMsg = (result as { error?: string; message?: string }).error || (result as { error?: string; message?: string }).message || "Failed to dispatch campaign.";
      showToast(errorMsg, "error");
    }
    setApproving(false);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    return (
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate campaign metrics
  const getSelectedCampaignStats = () => {
    if (!selectedCampaign) {
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }
    
    const sent = selectedCampaign.recipients_count || logs.length || 0;
    
    if (logs.length === 0) {
      return { sent, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }

    const delivered = logs.filter(l => l.status === "delivered" || l.status === "opened" || l.status === "clicked").length;
    const opened = logs.filter(l => l.status === "opened" || l.status === "clicked").length;
    const clicked = logs.filter(l => l.status === "clicked").length;
    const bounced = logs.filter(l => l.status === "failed" || l.event_type === "email.bounced" || l.event_type === "email.complained").length;

    return { sent, delivered, opened, clicked, bounced };
  };

  const stats = getSelectedCampaignStats();

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-[90rem] mx-auto pb-12">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <Mail className="w-5 h-5 text-zinc-400" />
              Email Broadcaster
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Compose manual newsletters, select layout styles, monitor delivery logs, and trigger campaigns.
            </p>
          </div>
          <button
            onClick={() => {
              setShowComposeModal(true);
              // Pre-load editorial template
              handleApplyTemplate("editorial");
            }}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Broadcast</span>
          </button>
        </div>

        {/* Resend API Integration Check */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Resend Delivery Authorization
              </span>
            </div>
            <button 
              onClick={checkResend}
              disabled={checkingResend}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer font-sans"
            >
              <RefreshCw className={`w-3 h-3 ${checkingResend ? "animate-spin" : ""}`} />
              <span>Verify Status</span>
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

        {/* Main Grid: Left Side Campaigns list, Right Side Selected Campaign statistics / logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Campaigns List (5 Columns) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200 font-sans"
                />
              </div>
            </div>

            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-zinc-950/40">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Sent Campaigns Ledger
                </span>
              </div>
              {loadingCampaigns ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-sans">Fetching campaign list...</span>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs font-sans">
                  No newsletters found in registry.
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[300px] lg:max-h-[600px] overflow-y-auto">
                  {filteredCampaigns.map((camp) => {
                    const isSelected = selectedCampaign?.id === camp.id;
                    return (
                      <button
                        key={camp.id}
                        onClick={() => setSelectedCampaign(camp)}
                        className={`w-full text-left p-4 transition-colors flex items-center justify-between gap-3 ${
                          isSelected 
                            ? "bg-white/[0.03] border-l-2 border-red-500" 
                            : "hover:bg-white/[0.01]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">{camp.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{camp.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              camp.status === "sent" 
                                ? "bg-green-500/10 text-green-400 font-bold"
                                : camp.status === "failed"
                                ? "bg-red-500/10 text-red-400 font-bold"
                                : camp.status === "sending"
                                ? "bg-yellow-500/10 text-yellow-400 font-bold"
                                : camp.status === "draft"
                                ? "bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold"
                                : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {camp.status.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {camp.sent_at ? new Date(camp.sent_at).toLocaleDateString() : new Date(camp.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Analytics / Log Viewer (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedCampaign ? (
              <div className="space-y-6">
                {selectedCampaign.status === "draft" ? (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Draft Review Header */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono uppercase">
                              Draft Campaign
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Created: {new Date(selectedCampaign.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h2 className="text-sm font-bold text-white tracking-tight font-sans mt-2">
                            {selectedCampaign.title}
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 font-sans">
                            <span className="font-semibold text-zinc-300">Subject:</span> {selectedCampaign.subject}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setConfirmInput("");
                            setShowConfirmModal(true);
                          }}
                          className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans bg-red-600 hover:bg-red-500 text-white border-red-600/30 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                          <span>Approve & Dispatch</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-center">
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Recipients</p>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{selectedCampaign.recipients_count || 0}</p>
                        </div>
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Target Segment</p>
                          <p className="text-xs font-semibold text-zinc-300 mt-2.5 truncate max-w-[150px] mx-auto font-mono">
                            {selectedCampaign.segment_id === "8324468f-0399-4c05-9b98-3e17e76ffa41"
                              ? "Marketing List"
                              : selectedCampaign.segment_id === "42a3da82-ad27-475f-b2ad-113c9c8fa6b8"
                              ? "Application List"
                              : "General Segment"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[550px]">
                      <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Campaign Content Preview
                        </span>
                        
                        <div className="flex bg-white/[0.02] border border-white/5 p-0.5 rounded-full">
                          <button
                            onClick={() => setPreviewTab("html")}
                            className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              previewTab === "html" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            HTML Layout
                          </button>
                          <button
                            onClick={() => setPreviewTab("text")}
                            className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              previewTab === "text" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            Plain Text
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 bg-zinc-950/40 p-4 overflow-y-auto">
                        {previewTab === "html" ? (
                          <div className="w-full h-full min-h-[400px] border border-white/5 rounded-xl bg-white overflow-hidden">
                            <iframe
                              sandbox="allow-same-origin"
                              title="HTML Template Preview"
                              srcDoc={selectedCampaign.html_content || selectedCampaign.content || ""}
                              className="w-full h-full border-0"
                            />
                          </div>
                        ) : (
                          <pre className="w-full h-full min-h-[400px] p-4 border border-white/5 rounded-xl bg-zinc-900/50 text-xs text-zinc-300 font-mono whitespace-pre-wrap overflow-y-auto">
                            {selectedCampaign.text_content || selectedCampaign.content || "No text content provided."}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Campaign Header / Metadata Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
                            {selectedCampaign.title}
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 font-sans">
                            <span className="font-semibold text-zinc-300">Subject:</span> {selectedCampaign.subject}
                          </p>
                        </div>
                        {selectedCampaign.resend_broadcast_id && (
                          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/5 rounded-full px-2.5 py-1 text-[9px] font-mono text-zinc-400 w-fit shrink-0">
                            <span>Resend ID:</span>
                            <span className="text-white font-bold max-w-[100px] truncate">{selectedCampaign.resend_broadcast_id}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-white/5 text-center">
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Dispatched</p>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{stats.sent}</p>
                        </div>
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Delivered</p>
                          <p className="text-lg font-bold text-green-400 mt-1 font-mono">
                            {stats.delivered} <span className="text-[10px] text-zinc-500 font-normal">({stats.sent > 0 ? Math.round((stats.delivered/stats.sent)*100) : 0}%)</span>
                          </p>
                        </div>
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Opened</p>
                          <p className="text-lg font-bold text-blue-400 mt-1 font-mono">
                            {stats.opened} <span className="text-[10px] text-zinc-500 font-normal">({stats.sent > 0 ? Math.round((stats.opened/stats.sent)*100) : 0}%)</span>
                          </p>
                        </div>
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Bounced</p>
                          <p className="text-lg font-bold text-red-400 mt-1 font-mono">{stats.bounced}</p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery logs terminal */}
                    <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
                          Delivery Logs & Events Tracker
                        </span>
                        <button
                          onClick={() => fetchLogsForCampaign(selectedCampaign.id)}
                          disabled={loadingLogs}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer font-sans"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${loadingLogs ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-sans">Updating event feed...</span>
                        </div>
                      ) : logs.length === 0 ? (
                        <div className="text-center py-16 text-zinc-500 text-xs font-sans leading-relaxed px-4">
                          No transactional events registered for this campaign.<br />
                          Webhooks updates are processed automatically at <code className="font-mono text-white bg-white/5 px-1 py-0.5 rounded">/api/webhooks/resend</code>.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 bg-zinc-950/20">
                                <th className="py-2.5 px-4 font-bold">Recipient</th>
                                <th className="py-2.5 px-4 font-bold">Event Type</th>
                                <th className="py-2.5 px-4 font-bold">Time (UTC)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                              {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.01]">
                                  <td className="py-2.5 px-4 font-medium text-white truncate max-w-[180px]">{log.recipient_email}</td>
                                  <td className="py-2.5 px-4">
                                    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border ${
                                      log.status === "clicked"
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : log.status === "opened"
                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        : log.status === "delivered"
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : log.status === "failed"
                                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                    }`}>
                                      {log.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[9px] text-zinc-500">
                                    {new Date(log.sent_at).toLocaleTimeString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-2xl text-zinc-500 font-sans gap-2">
                <Mail className="w-8 h-8 text-zinc-600" />
                <span className="text-xs">Select a campaign from the ledger to load delivery metrics and webhooks log tracking.</span>
              </div>
            )}
          </div>
        </div>

        {/* Compose Campaign Modal */}
        <AnimatePresence>
          {showComposeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowComposeModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl p-6 rounded-2xl border border-white/5 glass-panel relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight font-sans flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    Compose Manual Newsletter Campaign
                  </h3>
                  <button
                    onClick={() => setShowComposeModal(false)}
                    className="text-zinc-500 hover:text-white text-xs cursor-pointer font-sans"
                  >
                    Close
                  </button>
                </div>

                {/* Layout Picker */}
                <div className="space-y-2">
                  <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                    1. Select Email Layout Style
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl.id)}
                        className="text-left p-3 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200"
                      >
                        <p className="text-xs font-semibold text-white">{tmpl.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{tmpl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSaveDraft} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        Campaign Identifier Name (CMS log name)
                      </label>
                      <input
                        type="text"
                        required
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder="e.g. Monthly Newsletter - June 2026"
                        className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        Segment / Audience ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={segmentIdInput}
                        onChange={(e) => setSegmentIdInput(e.target.value)}
                        placeholder="e.g. resend-audience-xxxx (Leave empty to use General list)"
                        className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      required
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. Big updates from ABRAM Network"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        HTML Raw Template Markup
                      </label>
                      <textarea
                        required
                        rows={12}
                        value={htmlContentInput}
                        onChange={(e) => setHtmlContentInput(e.target.value)}
                        placeholder="Write your email markup here..."
                        className="w-full bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        Fallback Plain Text Version (for email software compatibility)
                      </label>
                      <textarea
                        required
                        rows={12}
                        value={textContentInput}
                        onChange={(e) => setTextContentInput(e.target.value)}
                        placeholder="Write your fallback plain text here..."
                        className="w-full bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-white/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowComposeModal(false)}
                      className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBroadcast}
                      className="btn-primary h-9 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                    >
                      {submittingBroadcast ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Campaign Draft</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Safety Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && selectedCampaign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !approving && setShowConfirmModal(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-2xl border border-red-500/20 glass-panel relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider w-fit font-sans">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Critical: Manual Dispatch Authorization</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white tracking-tight font-sans">
                    Confirm Email Campaign Send?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    You are about to broadcast the campaign <strong className="text-white">"{selectedCampaign.title}"</strong> to an estimated <strong className="text-white font-mono">{selectedCampaign.recipients_count || 0}</strong> subscribers on the <strong className="text-white">
                      {selectedCampaign.segment_id === "8324468f-0399-4c05-9b98-3e17e76ffa41"
                        ? "Marketing List"
                        : selectedCampaign.segment_id === "42a3da82-ad27-475f-b2ad-113c9c8fa6b8"
                        ? "Application List"
                        : "General Segment"}
                    </strong>.
                  </p>
                  <p className="text-[10px] text-zinc-500 font-sans">
                    * This action is irreversible and sends live emails immediately.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">
                    To proceed, type the safety phrase <span className="text-red-400 font-mono">CONFIRM SEND</span>:
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="CONFIRM SEND"
                    disabled={approving}
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/30 h-10 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={approving}
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmInput("");
                    }}
                    className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAndSend}
                    disabled={approving || confirmInput !== "CONFIRM SEND"}
                    className="btn-primary h-9 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans bg-red-600 hover:bg-red-500 text-white border-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Approve & Send Immediately</span>
                  </button>
                </div>
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
                ) : toast.type === "error" ? (
                  <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
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
