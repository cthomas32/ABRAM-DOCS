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
  Check,
  Edit
} from "lucide-react";
import { 
  getCampaigns, 
  createManualDraftCampaign, 
  approveAndSendCampaignAction,
  checkResendIntegrationStatus,
  getCampaignLogs,
  getEmailTemplates,
  getSubscribers,
  updateManualDraftCampaignAction,
  sendTestEmailAction
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
    description: "Classic dark-mode glassmorphic layout with header logo image, title, body content, cream CTA button, and standard blue links.",
    subject: "Update: New Release & Insights from ABRAM",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>ABRAM Update</title>
    <style type="text/css">
      body {
        margin: 0; padding: 0; min-width: 100% !important; width: 100% !important;
        background-color: #0A0A0A; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
      }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      .btn-primary:hover { background-color: #E4E4E7 !important; }
      .link-hover:hover { color: #FAFAF9 !important; text-decoration: underline !important; }
      @media screen and (max-width: 620px) {
        .container-table { width: 100% !important; max-width: 100% !important; border-radius: 0px !important; border: none !important; }
        .content-padding { padding: 32px 24px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <tr>
              <td align="center" style="padding: 44px 32px 16px;">
                <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding: 16px 32px 32px;">
                <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em;">
                  Our Latest Update
                </h1>
                <div style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px;">
                  <p style="margin: 0 0 16px 0;">Write your announcement body here. Customize this layout to share news, insights, or blog updates with your subscribers.</p>
                </div>
                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 16px; border-collapse: separate !important;">
                  <tr>
                    <td align="center" style="background-color: #FAFAF9; border-radius: 9999px; border-collapse: separate !important;">
                      <a href="https://abram.network" target="_blank" class="btn-primary" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 600; color: #0A0A0A; text-decoration: none; border-radius: 9999px;">
                        Read Full Story
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #27272A; padding-top: 24px;">
                  <tr>
                    <td>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 0;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 6px 0 0 0;">
                        Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
                      </p>
                    </td>
                  </tr>
                </table>
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
    description: "Release update template with bordered light-blue version pill badge, styled list items, and solid white CTA button.",
    subject: "Release Notes: ABRAM Network v1.1.0 Update",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Changelog Update</title>
    <style type="text/css">
      body {
        margin: 0; padding: 0; min-width: 100% !important; width: 100% !important;
        background-color: #0A0A0A; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
      }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      .btn-primary:hover { background-color: #E4E4E7 !important; }
      .link-hover:hover { color: #FAFAF9 !important; text-decoration: underline !important; }
      @media screen and (max-width: 620px) {
        .container-table { width: 100% !important; max-width: 100% !important; border-radius: 0px !important; border: none !important; }
        .content-padding { padding: 32px 24px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <tr>
              <td align="center" style="padding: 44px 32px 16px;">
                <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding: 16px 32px 32px;">
                <!-- Version Badge -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; border-collapse: separate !important;">
                  <tr>
                    <td align="center" style="border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.04); border-collapse: separate !important; vertical-align: middle;">
                      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #8ECAFF; line-height: 1;">
                        VERSION 1.1.0
                      </span>
                    </td>
                  </tr>
                </table>
                <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em;">
                  Changelog: What's New
                </h1>
                <div style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px;">
                  <p style="margin: 0 0 12px 0;">Here are the updates pushed in our latest deployment:</p>
                  <ul style="padding-left: 20px; margin: 12px 0; color: #A1A1AA;">
                    <li style="margin-bottom: 8px;"><strong style="color: #FAFAF9; font-weight: 600;">New Feature</strong>: Explain your new feature here.</li>
                    <li style="margin-bottom: 8px;"><strong style="color: #FAFAF9; font-weight: 600;">Performance Boost</strong>: Outline speed/efficiency updates.</li>
                    <li style="margin-bottom: 8px;"><strong style="color: #FAFAF9; font-weight: 600;">Bug Fixes</strong>: List fixed bugs.</li>
                  </ul>
                </div>
                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 16px; border-collapse: separate !important;">
                  <tr>
                    <td align="center" style="background-color: #FAFAF9; border-radius: 9999px; border-collapse: separate !important;">
                      <a href="https://abram.network/changelog" target="_blank" class="btn-primary" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 600; color: #0A0A0A; text-decoration: none; border-radius: 9999px;">
                        View Full Changelog
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #27272A; padding-top: 24px;">
                  <tr>
                    <td>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 0;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 6px 0 0 0;">
                        Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `ABRAM Release Notes\n\nVersion 1.1.0 - Changelog: What's New\n\n- New Feature: Explain your new feature here.\n- Performance Boost: Outline speed/efficiency updates.\n- Bug Fixes: List fixed bugs.\n\nView Full Changelog: https://abram.network/changelog\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`
  },
  {
    id: "minimal",
    name: "Minimal Text / Standard Update",
    description: "Simple, content-focused template with dark glass container and signature, optimized for direct messages.",
    subject: "Quick Update from ABRAM Team",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Quick Update</title>
    <style type="text/css">
      body {
        margin: 0; padding: 0; min-width: 100% !important; width: 100% !important;
        background-color: #0A0A0A; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
      }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      .link-hover:hover { color: #FAFAF9 !important; text-decoration: underline !important; }
      @media screen and (max-width: 620px) {
        .container-table { width: 100% !important; max-width: 100% !important; border-radius: 0px !important; border: none !important; }
        .content-padding { padding: 32px 24px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" class="container-table" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <tr>
              <td align="center" style="padding: 44px 32px 16px;">
                <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding: 16px 32px 32px;">
                <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em;">
                  ABRAM News
                </h1>
                <div style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px;">
                  <p style="margin: 0 0 16px 0;">Hello {{{first_name}}},</p>
                  <p style="margin: 0 0 16px 0;">Write your message here. This template uses a brand-aligned dark background and light text optimized for readability and compliance with the ABRAM brand system.</p>
                  <p style="margin: 24px 0 0 0;">Best regards,<br>The ABRAM Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #27272A; padding-top: 24px;">
                  <tr>
                    <td>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 0;">
                        You are receiving this because you subscribed to updates from ABRAM.
                      </p>
                      <p style="font-size: 11px; color: #71717A; line-height: 1.6; margin: 6px 0 0 0;">
                        Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="link-hover" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
                      </p>
                    </td>
                  </tr>
                </table>
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

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
}

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
  const [segmentIdInput, setSegmentIdInput] = useState("8324468f-0399-4c05-9b98-3e17e76ffa41");
  const [htmlContentInput, setHtmlContentInput] = useState("");
  const [textContentInput, setTextContentInput] = useState("");
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Audience Type Selection states
  const [audienceType, setAudienceType] = useState<"segment" | "subscribers" | "manual">("segment");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [subscriberSearchTerm, setSubscriberSearchTerm] = useState("");
  const [manualEmailsInput, setManualEmailsInput] = useState("");

  // Editor Split Tab
  const [editorTab, setEditorTab] = useState<"html" | "text">("html");

  // Editor Textarea Refs
  const htmlTextAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const textTextAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // Safety Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [approving, setApproving] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");

  // Test Email Modal State
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Sent Campaign View / Resend State
  const [showSentPreview, setShowSentPreview] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendConfirmInput, setResendConfirmInput] = useState("");
  const [resending, setResending] = useState(false);

  const fetchTemplates = async () => {
    const result = await getEmailTemplates();
    if (result.success && result.templates && result.templates.length > 0) {
      const formatted = result.templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || `Database-configured template named ${t.name}`,
        subject: t.subject_layout || "",
        html: t.html_template,
        text: `Please compose plain text copy for the ${t.name} template.`
      }));
      setDbTemplates(formatted);
    }
  };

  const fetchSubscribers = async () => {
    const result = await getSubscribers();
    if (result.success && result.subscribers) {
      setSubscribers(result.subscribers as Subscriber[]);
    }
  };

  useEffect(() => {
    fetchCampaignData();
    checkResend();
    fetchTemplates();
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchLogsForCampaign(selectedCampaign.id);
    } else {
      setLogs([]);
    }
  }, [selectedCampaign]);

  const insertAtCursor = (textToInsert: string) => {
    const textarea = editorTab === "html" ? htmlTextAreaRef.current : textTextAreaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = textarea.value;

    const newText = 
      currentText.substring(0, startPos) + 
      textToInsert + 
      currentText.substring(endPos, currentText.length);

    if (editorTab === "html") {
      setHtmlContentInput(newText);
    } else {
      setTextContentInput(newText);
    }

    // Reposition cursor after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertHtml = (type: string) => {
    let insertText = "";
    switch (type) {
      case "h1":
        insertText = '<h1 style="font-size:28px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;margin:0 0 16px;">Heading 1</h1>';
        break;
      case "h2":
        insertText = '<h2 style="font-size:20px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.2px;margin:0 0 12px;">Heading 2</h2>';
        break;
      case "p":
        insertText = '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#888888;">Paragraph text here.</p>';
        break;
      case "a":
        insertText = '<a href="https://abram.network" style="color:#ffffff;text-decoration:underline;">Link Text</a>';
        break;
      case "cta":
        insertText = `<!-- CTA Button -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 32px;">
  <tr>
    <td style="background-color:#ffffff;border-radius:9999px;">
      <a href="https://abram.network" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.2px;">
        Read Full Story
      </a>
    </td>
  </tr>
</table>`;
        break;
      case "bold":
        insertText = '<strong style="color:#ffffff;font-weight:600;">bold text</strong>';
        break;
      case "ul":
        insertText = `<ul style="padding-left:20px;margin:12px 0;color:#888888;">
  <li style="margin-bottom:8px;"><strong style="color:#ffffff;font-weight:600;">Item 1</strong>: Description.</li>
  <li style="margin-bottom:8px;"><strong style="color:#ffffff;font-weight:600;">Item 2</strong>: Description.</li>
</ul>`;
        break;
      case "var_first_name":
        insertText = "{{{first_name}}}";
        break;
      case "var_last_name":
        insertText = "{{{last_name}}}";
        break;
      case "var_unsubscribe":
        insertText = "{{{RESEND_UNSUBSCRIBE_URL}}}";
        break;
      default:
        break;
    }
    insertAtCursor(insertText);
  };

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
    const activeTemplates = dbTemplates.length > 0 ? dbTemplates : TEMPLATES;
    const template = activeTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubjectInput(template.subject);
      setHtmlContentInput(template.html);
      setTextContentInput(template.text);
      showToast(`Applied ${template.name} template!`, "info");
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !subjectInput || !htmlContentInput) {
      showToast("Please complete all required fields (Campaign Identifier, Subject Line, and HTML Markup).", "error");
      return;
    }

    let resolvedSegmentId = segmentIdInput || undefined;
    let metadata: any = { audience_type: audienceType };
    let resolvedRecipientsCount: number | undefined = undefined;

    if (audienceType === "subscribers") {
      if (selectedSubscribers.length === 0) {
        showToast("Please select at least one subscriber.", "error");
        return;
      }
      metadata.emails = selectedSubscribers;
      resolvedRecipientsCount = selectedSubscribers.length;
      resolvedSegmentId = undefined;
    } else if (audienceType === "manual") {
      const parsedEmails = manualEmailsInput
        .split(/[\s,;]+/)
        .map(email => email.trim())
        .filter(email => email && email.includes("@"));
      
      if (parsedEmails.length === 0) {
        showToast("Please enter at least one valid email address.", "error");
        return;
      }
      metadata.emails = parsedEmails;
      resolvedRecipientsCount = parsedEmails.length;
      resolvedSegmentId = undefined;
    } else {
      metadata.audience_type = "segment";
      if (!resolvedSegmentId) {
        resolvedSegmentId = "8324468f-0399-4c05-9b98-3e17e76ffa41";
      }
    }
    
    setSubmittingBroadcast(true);
    let result;
    if (editingCampaignId) {
      result = await updateManualDraftCampaignAction(
        editingCampaignId,
        titleInput,
        subjectInput,
        textContentInput || "Please view the HTML version of this email.",
        htmlContentInput,
        resolvedSegmentId,
        metadata,
        resolvedRecipientsCount
      );
    } else {
      result = await createManualDraftCampaign(
        titleInput,
        subjectInput,
        textContentInput || "Please view the HTML version of this email.",
        htmlContentInput,
        resolvedSegmentId,
        metadata,
        resolvedRecipientsCount
      );
    }

    if (result.success) {
      showToast(
        editingCampaignId
          ? "Campaign draft updated successfully!"
          : "Campaign draft created! Please review and approve it from the ledger.",
        "success"
      );
      setShowComposeModal(false);
      setTitleInput("");
      setSubjectInput("");
      setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
      setHtmlContentInput("");
      setTextContentInput("");
      setSelectedSubscribers([]);
      setManualEmailsInput("");
      setAudienceType("segment");
      setEditingCampaignId(null);
      fetchCampaignData();
    } else {
      const errorMsg = (result as { error?: string; message?: string }).error || (result as { error?: string; message?: string }).message || "Failed to save campaign draft.";
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

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    if (!htmlContentInput) {
      showToast("No HTML content to send. Please write your email first.", "error");
      return;
    }
    setSendingTestEmail(true);
    const result = await sendTestEmailAction(
      testEmailAddress,
      subjectInput || "Test Preview",
      htmlContentInput,
      textContentInput
    );
    if (result.success) {
      showToast(result.message || `Test email sent to ${testEmailAddress}!`, "success");
      setShowTestEmailModal(false);
    } else {
      showToast(result.error || "Failed to send test email.", "error");
    }
    setSendingTestEmail(false);
  };

  const handleResendSameAudience = async () => {
    if (!selectedCampaign || resendConfirmInput !== "CONFIRM SEND") return;
    setResending(true);
    // Step 1: Create a new draft from the sent campaign's content
    const meta = selectedCampaign.metadata || {};
    const createResult = await createManualDraftCampaign(
      `[Resend] ${selectedCampaign.title}`,
      selectedCampaign.subject,
      selectedCampaign.text_content || "Please view the HTML version of this email.",
      selectedCampaign.html_content || selectedCampaign.content || "",
      selectedCampaign.segment_id || undefined,
      meta,
      selectedCampaign.recipients_count || undefined
    );
    if (!createResult.success || !(createResult as any).campaignId) {
      showToast((createResult as any).error || "Failed to create resend draft.", "error");
      setResending(false);
      return;
    }
    // Step 2: Immediately approve and send the new draft
    const sendResult = await approveAndSendCampaignAction((createResult as any).campaignId, resendConfirmInput);
    if (sendResult.success) {
      showToast("Campaign resent successfully to the same audience!", "success");
      setShowResendModal(false);
      setResendConfirmInput("");
      fetchCampaignData();
    } else {
      const errorMsg = (sendResult as any).error || (sendResult as any).message || "Resend failed.";
      showToast(errorMsg, "error");
    }
    setResending(false);
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
              setEditingCampaignId(null);
              setTitleInput("");
              setSubjectInput("");
              setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
              setHtmlContentInput("");
              setTextContentInput("");
              setSelectedSubscribers([]);
              setManualEmailsInput("");
              setAudienceType("segment");
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

        {/* Resend API Integration Check — only shown when disconnected */}
        {resendStatus.status !== "Connected" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-400 font-sans">Resend not connected</p>
              <p className="text-[10px] text-zinc-500 font-sans truncate">
                {resendStatus.message || "API key missing or invalid. Check your environment variables."}
              </p>
            </div>
            <button
              onClick={checkResend}
              disabled={checkingResend}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer font-sans shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${checkingResend ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Main Grid: Left Side Campaigns list, Right Side Selected Campaign statistics / logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {showComposeModal ? (
            <div className="lg:col-span-12 space-y-6 animate-fadeIn">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                {/* Editor Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight font-sans flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      {editingCampaignId ? "Edit Campaign Draft" : "Compose Manual Newsletter Campaign"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 font-sans">
                      Create or modify your newsletter campaign, select recipients, and review rendering side-by-side.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowComposeModal(false);
                        setEditingCampaignId(null);
                      }}
                      className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    {htmlContentInput && (
                      <button
                        type="button"
                        onClick={() => setShowTestEmailModal(true)}
                        className="btn-glass h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <Send className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Send Test</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const form = document.getElementById("campaignFormInline") as HTMLFormElement;
                        if (form) form.requestSubmit();
                      }}
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
                </div>

                {/* 1. Layout Selection */}
                <div className="space-y-2">
                  <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                    1. Select Email Layout Style
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(dbTemplates.length > 0 ? dbTemplates : TEMPLATES).map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl.id)}
                        className="text-left p-3 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-white">{tmpl.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{tmpl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Elements */}
                <form id="campaignFormInline" onSubmit={handleSaveDraft} className="space-y-6">
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
                  </div>

                  {/* 2. Target Audience Selection */}
                  <div className="space-y-3">
                    <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                      2. Target Audience
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setAudienceType("segment")}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          audienceType === "segment"
                            ? "bg-white/[0.04] border-white/20 text-white"
                            : "bg-white/[0.01] border-white/5 text-zinc-400 hover:border-white/15"
                        }`}
                      >
                        <p className="text-xs font-semibold">Broadcast Segment</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans leading-relaxed">Send to a pre-defined mailing list (general segment).</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudienceType("subscribers")}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          audienceType === "subscribers"
                            ? "bg-white/[0.04] border-white/20 text-white"
                            : "bg-white/[0.01] border-white/5 text-zinc-400 hover:border-white/15"
                        }`}
                      >
                        <p className="text-xs font-semibold">Select Specific Subscribers</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans leading-relaxed">Select individual subscribers from the system.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudienceType("manual")}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          audienceType === "manual"
                            ? "bg-white/[0.04] border-white/20 text-white"
                            : "bg-white/[0.01] border-white/5 text-zinc-400 hover:border-white/15"
                        }`}
                      >
                        <p className="text-xs font-semibold">Manual Entry</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans leading-relaxed">Enter a list of comma- or newline-separated emails.</p>
                      </button>
                    </div>
                  </div>

                  {/* Audience Inputs */}
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                    {audienceType === "segment" && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                          Broadcast List / Segment
                        </label>
                        <select
                          value={segmentIdInput}
                          onChange={(e) => setSegmentIdInput(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/8 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 h-10 font-sans cursor-pointer"
                        >
                          <option value="8324468f-0399-4c05-9b98-3e17e76ffa41">Marketing List (General Segment)</option>
                          <option value="42a3da82-ad27-475f-b2ad-113c9c8fa6b8">Application List (App Segment)</option>
                          <option value="custom">Custom Segment ID...</option>
                        </select>
                        
                        {segmentIdInput === "custom" && (
                          <div className="mt-2.5 animate-fadeIn">
                            <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                              Enter Custom Segment ID
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. resend-segment-xxxx"
                              onChange={(e) => setSegmentIdInput(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10 font-sans"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {audienceType === "subscribers" && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">
                              Subscribers Checklist
                            </label>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                              Selected: <span className="text-white font-semibold font-mono">{selectedSubscribers.length}</span> of {subscribers.length} subscribers
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = subscribers.filter(sub => 
                                  sub.email.toLowerCase().includes(subscriberSearchTerm.toLowerCase()) || 
                                  (sub.first_name || "").toLowerCase().includes(subscriberSearchTerm.toLowerCase()) ||
                                  (sub.last_name || "").toLowerCase().includes(subscriberSearchTerm.toLowerCase())
                                ).map(sub => sub.email);
                                
                                setSelectedSubscribers(prev => {
                                  const otherSelected = prev.filter(email => !filtered.includes(email));
                                  if (filtered.every(email => prev.includes(email))) {
                                    return otherSelected;
                                  } else {
                                    return [...new Set([...otherSelected, ...filtered])];
                                  }
                                });
                              }}
                              className="btn-glass px-2.5 py-1 text-[9px] rounded-full cursor-pointer h-7"
                            >
                              Toggle Visible
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSubscribers([])}
                              className="btn-glass px-2.5 py-1 text-[9px] rounded-full text-red-400 border-red-500/10 hover:bg-red-500/10 cursor-pointer h-7"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter subscribers by name or email..."
                            value={subscriberSearchTerm}
                            onChange={(e) => setSubscriberSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/8 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-9 font-sans"
                          />
                        </div>

                        <div className="border border-white/5 bg-zinc-950/40 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                          {subscribers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-zinc-500 font-sans">
                              No subscribers found in database.
                            </div>
                          ) : (
                            subscribers
                              .filter(sub => 
                                sub.email.toLowerCase().includes(subscriberSearchTerm.toLowerCase()) || 
                                (sub.first_name || "").toLowerCase().includes(subscriberSearchTerm.toLowerCase()) ||
                                (sub.last_name || "").toLowerCase().includes(subscriberSearchTerm.toLowerCase())
                              )
                              .map((sub) => {
                                const isChecked = selectedSubscribers.includes(sub.email);
                                return (
                                  <label
                                    key={sub.id}
                                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/[0.01] transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSelectedSubscribers(prev => 
                                          isChecked 
                                            ? prev.filter(email => email !== sub.email) 
                                            : [...prev, sub.email]
                                        );
                                      }}
                                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <span className="text-xs text-zinc-300 font-semibold truncate">
                                        {sub.first_name || sub.last_name 
                                          ? `${sub.first_name || ""} ${sub.last_name || ""}`.trim() 
                                          : "Anonymous"}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 font-mono truncate">{sub.email}</span>
                                    </div>
                                  </label>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}

                    {audienceType === "manual" && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                            Manual Email Addresses
                          </label>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            Parsed: {
                              manualEmailsInput
                                .split(/[\s,;]+/)
                                .map(email => email.trim())
                                .filter(email => email && email.includes("@")).length
                            } emails
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={manualEmailsInput}
                          onChange={(e) => setManualEmailsInput(e.target.value)}
                          placeholder="Enter email addresses separated by commas, semicolons, or newlines (e.g. user1@domain.com, user2@domain.com)"
                          className="w-full bg-white/[0.03] border border-white/8 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 font-mono leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Split Editor */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                      3. Campaign Content
                    </span>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 border border-white/5 rounded-2xl overflow-hidden bg-zinc-950/20">
                      {/* Left Editor Pane (6 Columns) */}
                      <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 h-[500px] lg:h-[600px]">
                        {/* Editor Tabs */}
                        <div className="flex items-center justify-between bg-zinc-950/40 px-3 py-2 border-b border-white/5">
                          <div className="flex bg-white/[0.02] border border-white/5 p-0.5 rounded-full">
                            <button
                              type="button"
                              onClick={() => setEditorTab("html")}
                              className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                editorTab === "html" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              HTML Markup
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorTab("text")}
                              className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                editorTab === "text" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              Plain Text
                            </button>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {editorTab === "html" ? "live layout mode" : "fallback text mode"}
                          </span>
                        </div>

                        {/* Editor Toolbar */}
                        {editorTab === "html" ? (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/40 border-b border-white/5 select-none">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center mr-1">Insert:</span>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("h1")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("h2")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("p")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Paragraph
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("a")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Link
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("cta")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              CTA Button
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("bold")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Bold
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("ul")}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] transition-colors cursor-pointer"
                            >
                              List
                            </button>
                            
                            <div className="w-px h-4 bg-white/10 mx-1 align-middle my-auto" />
                            
                            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center mr-1">Vars:</span>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_first_name")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              first_name
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_last_name")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              last_name
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_unsubscribe")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              unsubscribe_url
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/40 border-b border-white/5 select-none">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center mr-1">Vars:</span>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_first_name")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              first_name
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_last_name")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              last_name
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertHtml("var_unsubscribe")}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono rounded text-[9px] transition-colors cursor-pointer"
                            >
                              unsubscribe_url
                            </button>
                          </div>
                        )}

                        {/* Editor Content Area */}
                        <div className="flex-1 min-h-0 relative">
                          {editorTab === "html" ? (
                            <textarea
                              ref={htmlTextAreaRef}
                              required
                              value={htmlContentInput}
                              onChange={(e) => setHtmlContentInput(e.target.value)}
                              placeholder="Write your email HTML markup here..."
                              className="w-full h-full bg-transparent p-4 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none resize-none overflow-y-auto"
                            />
                          ) : (
                            <textarea
                              ref={textTextAreaRef}
                              required
                              value={textContentInput}
                              onChange={(e) => setTextContentInput(e.target.value)}
                              placeholder="Write your fallback plain text here..."
                              className="w-full h-full bg-transparent p-4 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none resize-none overflow-y-auto"
                            />
                          )}
                        </div>
                      </div>

                      {/* Right Preview Pane (6 Columns) */}
                      <div className="lg:col-span-6 flex flex-col h-[500px] lg:h-[600px]">
                        <div className="bg-zinc-950/40 px-3 py-2 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                            Live Preview
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {editorTab === "html" ? "HTML Output" : "Plain Text Output"}
                          </span>
                        </div>
                        <div className="flex-1 bg-zinc-900/10 min-h-0 overflow-hidden relative">
                          {editorTab === "html" ? (
                            <iframe
                              sandbox="allow-same-origin"
                              title="Editor HTML Preview"
                              srcDoc={htmlContentInput || ""}
                              className="w-full h-full border-0 bg-white"
                            />
                          ) : (
                            <pre className="w-full h-full p-4 text-xs text-zinc-400 font-mono whitespace-pre-wrap overflow-y-auto bg-zinc-950/40">
                              {textContentInput || "No text content provided."}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Actions */}
                  <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowComposeModal(false);
                        setEditingCampaignId(null);
                      }}
                      className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    {htmlContentInput && (
                      <button
                        type="button"
                        onClick={() => setShowTestEmailModal(true)}
                        className="btn-glass h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <Send className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Send Test Email</span>
                      </button>
                    )}
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
              </div>
            </div>
          ) : (
            <>
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
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              // Pre-populate input states with selected campaign details
                              setTitleInput(selectedCampaign.title || "");
                              setSubjectInput(selectedCampaign.subject || "");
                              setHtmlContentInput(selectedCampaign.html_content || selectedCampaign.content || "");
                              setTextContentInput(selectedCampaign.text_content || "");
                              
                              // Extract and apply audience configuration
                              const meta = selectedCampaign.metadata || {};
                              if (meta.audience_type === "subscribers") {
                                setAudienceType("subscribers");
                                setSelectedSubscribers(meta.emails || []);
                                setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
                              } else if (meta.audience_type === "manual") {
                                setAudienceType("manual");
                                setManualEmailsInput((meta.emails || []).join(", "));
                                setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
                              } else {
                                setAudienceType("segment");
                                setSegmentIdInput(selectedCampaign.segment_id || "8324468f-0399-4c05-9b98-3e17e76ffa41");
                              }
                              
                              // Track the draft being edited
                              setEditingCampaignId(selectedCampaign.id);
                              setShowComposeModal(true);
                            }}
                            className="btn-glass h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <Edit className="w-4 h-4 text-zinc-400" />
                            <span>Edit Draft</span>
                          </button>
                          
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
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-center">
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Recipients</p>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{selectedCampaign.recipients_count || 0}</p>
                        </div>
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Target Audience</p>
                          <p className="text-xs font-semibold text-zinc-300 mt-2.5 truncate max-w-[150px] mx-auto font-mono">
                            {selectedCampaign.metadata?.audience_type === "subscribers"
                              ? "Specific Subscribers"
                              : selectedCampaign.metadata?.audience_type === "manual"
                              ? "Manual Email List"
                              : selectedCampaign.segment_id === "8324468f-0399-4c05-9b98-3e17e76ffa41"
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
                    {/* Sent Campaign Header / Action Bar */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-mono uppercase">
                              Sent
                            </span>
                            {selectedCampaign.sent_at && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(selectedCampaign.sent_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <h2 className="text-sm font-bold text-white tracking-tight font-sans truncate">
                            {selectedCampaign.title}
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1 font-sans">
                            <span className="font-semibold text-zinc-300">Subject:</span> {selectedCampaign.subject}
                          </p>
                        </div>
                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => setShowSentPreview(v => !v)}
                            className="btn-glass h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{showSentPreview ? "Hide Content" : "View Content"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setTitleInput(`[Copy] ${selectedCampaign.title}`);
                              setSubjectInput(selectedCampaign.subject || "");
                              setHtmlContentInput(selectedCampaign.html_content || selectedCampaign.content || "");
                              setTextContentInput(selectedCampaign.text_content || "");
                              const meta = selectedCampaign.metadata || {};
                              if (meta.audience_type === "subscribers") {
                                setAudienceType("subscribers");
                                setSelectedSubscribers(meta.emails || []);
                                setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
                              } else if (meta.audience_type === "manual") {
                                setAudienceType("manual");
                                setManualEmailsInput((meta.emails || []).join(", "));
                                setSegmentIdInput("8324468f-0399-4c05-9b98-3e17e76ffa41");
                              } else {
                                setAudienceType("segment");
                                setSegmentIdInput(selectedCampaign.segment_id || "8324468f-0399-4c05-9b98-3e17e76ffa41");
                              }
                              setEditingCampaignId(null);
                              setShowComposeModal(true);
                            }}
                            className="btn-glass h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <Edit className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Edit &amp; Resend</span>
                          </button>
                          <button
                            onClick={() => {
                              setResendConfirmInput("");
                              setShowResendModal(true);
                            }}
                            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resend Same Audience</span>
                          </button>
                        </div>
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

                      {selectedCampaign.resend_broadcast_id && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                          <span className="text-zinc-600">Resend ID:</span>
                          <span className="text-zinc-400 font-bold">{selectedCampaign.resend_broadcast_id}</span>
                        </div>
                      )}
                    </div>

                    {/* View Content toggle — full email preview */}
                    <AnimatePresence>
                      {showSentPreview && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="glass-panel border border-white/5 rounded-2xl overflow-hidden"
                        >
                          <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sent Email Content Preview</span>
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
                          <div className="h-[500px] bg-zinc-950/20">
                            {previewTab === "html" ? (
                              <iframe
                                sandbox="allow-same-origin"
                                title="Sent Email Preview"
                                srcDoc={selectedCampaign.html_content || selectedCampaign.content || ""}
                                className="w-full h-full border-0"
                              />
                            ) : (
                              <pre className="w-full h-full p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap overflow-y-auto">
                                {selectedCampaign.text_content || selectedCampaign.content || "No plain text content saved."}
                              </pre>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Delivery logs terminal */}
                    <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
                          Delivery Logs &amp; Events Tracker
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
                        <div className="py-10 px-6 flex flex-col items-center gap-5 text-center">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-800/60 border border-white/8 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-zinc-300 text-sm font-medium font-sans mb-1">No delivery events yet</p>
                            <p className="text-zinc-500 text-xs font-sans max-w-sm">
                              Events are received via webhook. Register your endpoint in the Resend dashboard so delivery data starts flowing in.
                            </p>
                          </div>

                          {/* Setup steps */}
                          <div className="w-full max-w-sm text-left border border-white/8 rounded-xl overflow-hidden bg-zinc-950/40">
                            <div className="px-4 py-2.5 border-b border-white/5 bg-zinc-900/30">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Webhook Setup</span>
                            </div>
                            <ol className="divide-y divide-white/5">
                              {[
                                { step: "1", label: "Open", action: "resend.com/webhooks", href: "https://resend.com/webhooks" },
                                { step: "2", label: "Add endpoint URL", action: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/resend` },
                                { step: "3", label: "Select events", action: "email.sent · email.delivered · email.opened · email.clicked · email.bounced" },
                                { step: "4", label: "Save & send a test email", action: "Events will appear here automatically" },
                              ].map(({ step, label, action, href }) => (
                                <li key={step} className="flex items-start gap-3 px-4 py-3">
                                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-400">{step}</span>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-zinc-300 font-sans">{label}</p>
                                    {href ? (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 font-mono break-all">{action}</a>
                                    ) : (
                                      <p className="text-[10px] text-zinc-500 font-mono break-all">{action}</p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <p className="text-[10px] text-zinc-600 font-sans">
                            Already configured? Click <span className="text-zinc-400">Refresh</span> above to check for new events.
                          </p>
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
          </>
          )}
        </div>

        {/* Safety Confirmation Modal (draft → send) */}
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
                    You are about to broadcast the campaign <strong className="text-white">&ldquo;{selectedCampaign.title}&rdquo;</strong> to an estimated <strong className="text-white font-mono">{selectedCampaign.recipients_count || 0}</strong> subscribers on the <strong className="text-white">
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
                    <span>Approve &amp; Send Immediately</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Test Email Modal */}
        <AnimatePresence>
          {showTestEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !sendingTestEmail && setShowTestEmailModal(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm p-6 rounded-2xl border border-white/10 glass-panel relative z-10 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">Send Test Email</h3>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Verify layout before sending to everyone</p>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                  <p className="text-[10px] text-blue-300 font-sans leading-relaxed">
                    A preview will be sent to the address below. The subject line will be prefixed with <span className="font-mono font-bold">[TEST]</span> so it&apos;s easy to identify in your inbox.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTestEmail()}
                    placeholder="you@example.com"
                    disabled={sendingTestEmail}
                    autoFocus
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/30 h-10 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={sendingTestEmail}
                    onClick={() => setShowTestEmailModal(false)}
                    className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail || !testEmailAddress.includes("@")}
                    className="btn-primary h-9 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingTestEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{sendingTestEmail ? "Sending..." : "Send Test"}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Resend Same Audience Confirmation Modal */}
        <AnimatePresence>
          {showResendModal && selectedCampaign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !resending && setShowResendModal(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-2xl border border-yellow-500/20 glass-panel relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider w-fit font-sans">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Authorization</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white tracking-tight font-sans">
                    Resend to Same Audience?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    This will create a new campaign from <strong className="text-white">&ldquo;{selectedCampaign.title}&rdquo;</strong> and immediately dispatch it to the same audience (<strong className="text-white font-mono">{selectedCampaign.recipients_count || 0}</strong> recipients). The original campaign record will remain unchanged.
                  </p>
                  <p className="text-[10px] text-zinc-500 font-sans">
                    * A new campaign entry will appear in the ledger as <span className="font-mono text-zinc-300">[Resend] {selectedCampaign.title}</span>.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">
                    Type <span className="text-yellow-400 font-mono">CONFIRM SEND</span> to proceed:
                  </label>
                  <input
                    type="text"
                    value={resendConfirmInput}
                    onChange={(e) => setResendConfirmInput(e.target.value)}
                    placeholder="CONFIRM SEND"
                    disabled={resending}
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/30 h-10 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resending}
                    onClick={() => { setShowResendModal(false); setResendConfirmInput(""); }}
                    className="btn-glass h-9 px-4 text-xs font-semibold rounded-full cursor-pointer font-sans disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResendSameAudience}
                    disabled={resending || resendConfirmInput !== "CONFIRM SEND"}
                    className="btn-primary h-9 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer font-sans bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>{resending ? "Resending..." : "Confirm Resend"}</span>
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
