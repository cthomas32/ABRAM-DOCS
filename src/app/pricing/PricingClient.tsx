"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Minus, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles, 
  Users,
  User,
  ArrowRight
} from "lucide-react";

// --- Types ---

interface Feature {
  id: string;
  name: string;
}

interface Category {
  category: string;
  features: Feature[];
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number | null;
  price_type: "flat" | "per_seat" | "custom";
  billing_cycle: string;
  seats: {
    min: number;
    max: number | null;
    included: number;
  };
  ai_credits: {
    monthly_quota: number;
    is_per_seat: boolean;
    unlimited?: boolean;
    custom?: boolean;
  };
  audience: string;
  features: Record<string, boolean | string>;
  marketingFeatures: string[];
}

// --- Data ---

const FEATURES_SCHEMA: Category[] = [
  {
    category: "Workspace & Logistics",
    features: [
      { id: "ai_credits", name: "Monthly AI Credits" },
      { id: "workspace_storage", name: "Workspace Storage" },
      { id: "active_projects", name: "Active Projects" },
      { id: "locations", name: "Workspace Locations" },
      { id: "interactive_scheduler", name: "Advanced Scheduling Access" },
      { id: "barcode_scanning", name: "Barcode Equipment Scanning" },
      { id: "audit_logs_viewer", name: "Compliance Audit Logs" },
      { id: "team_permissions", name: "Team Roles & Permissions" },
      { id: "transit_buffers", name: "Transit Buffer Days" },
      { id: "return_inspections", name: "Equipment Return Inspections" },
      { id: "repair_lockouts", name: "Needs Repair Lockouts" },
      { id: "sso_scim", name: "SSO & Directory Sync (SAML/SCIM)" }
    ]
  },
  {
    category: "Intake & Project Setup",
    features: [
      { id: "manual_projects", name: "Manual Project Creator" },
      { id: "brief_analyzer", name: "Brief Intelligence (AI Brief Analyzer)" },
      { id: "intake_forms", name: "Custom Intake Forms" },
      { id: "form_mapping", name: "Intake Form Skill/Gear Mapping" },
      { id: "domain_gating", name: "Email Domain Gating" }
    ]
  },
  {
    category: "Crewing & Utilization",
    features: [
      { id: "personal_calendar", name: "Personal Utilization Calendar" },
      { id: "integrated_timesheets", name: "Timesheets & Time Tracking" },
      { id: "calendar_sync", name: "External Calendar Sync (Google/Outlook)" },
      { id: "talent_search", name: "Internal Talent Roster Search" },
      { id: "ai_matchmaking", name: "AI Matchmaking & Co-pilot Suggestions" },
      { id: "capacity_planning", name: "Shared Capacity Planning Dashboard" },
      { id: "conflict_alerts", name: "Calendar Conflict Alerts" },
      { id: "external_invites", name: "External Roster Expansion (invite_external)" }
    ]
  },
  {
    category: "Integrations & Collaboration",
    features: [
      { id: "file_sharing", name: "Basic File Sharing & Comments" },
      { id: "callsheet_pdf_export", name: "Branded Watermark-Free PDF Exports" },
      { id: "callsheet_email_distribution", name: "Automated Call Sheet Distribution" },
      { id: "asset_approvals", name: "Versioned Asset Approvals" },
      { id: "slack_integration", name: "Slack Integration" },
      { id: "frameio_integration", name: "Frame.io Integration" }
    ]
  },
  {
    category: "Financials & Payments",
    features: [
      { id: "stripe_express", name: "Stripe Express Onboarding" },
      { id: "invoicing", name: "Invoice Generation & Standard Payouts" },
      { id: "financial_dashboard", name: "Client-Contractor Financial Dashboard" },
      { id: "po_holds", name: "Purchase Order (PO) 7-day Card Holds" },
      { id: "budgeting_access", name: "Advanced Budgeting Access" }
    ]
  }
];

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_type: "flat",
    billing_cycle: "monthly",
    seats: { min: 1, max: 1, included: 1 },
    ai_credits: { monthly_quota: 0, is_per_seat: false },
    audience: "Independent freelancers, creative contractors, and crew members.",
    features: {
      workspace_storage: "500 MB",
      active_projects: "Up to 1",
      locations: "Unlimited",
      interactive_scheduler: "Read-Only",
      barcode_scanning: false,
      audit_logs_viewer: false,
      team_permissions: false,
      transit_buffers: false,
      return_inspections: false,
      repair_lockouts: false,
      sso_scim: false,
      manual_projects: true,
      brief_analyzer: false,
      intake_forms: false,
      form_mapping: false,
      domain_gating: false,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: false,
      talent_search: false,
      ai_matchmaking: false,
      capacity_planning: "Basic Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "1 Seat Limit",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: false,
      callsheet_email_distribution: false,
      asset_approvals: true,
      slack_integration: false,
      frameio_integration: false,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Trial (5 lines/expenses)"
    },
    marketingFeatures: [
      "1 seat & 1 active project limit",
      "Digital call sheet builder (watermarked)",
      "View-only resource scheduler",
      "500 MB workspace storage limit"
    ]
  },
  {
    id: "solo_lite",
    name: "Solo Lite",
    price_monthly: 19,
    price_type: "flat",
    billing_cycle: "monthly",
    seats: { min: 1, max: 1, included: 1 },
    ai_credits: { monthly_quota: 300, is_per_seat: false },
    audience: "Independent creative producers and solo operators.",
    features: {
      workspace_storage: "3 GB",
      active_projects: "Unlimited",
      locations: "Unlimited",
      interactive_scheduler: "Read-Only",
      barcode_scanning: false,
      audit_logs_viewer: false,
      team_permissions: false,
      transit_buffers: false,
      return_inspections: false,
      repair_lockouts: false,
      sso_scim: false,
      manual_projects: true,
      brief_analyzer: false,
      intake_forms: false,
      form_mapping: false,
      domain_gating: false,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: false,
      talent_search: false,
      ai_matchmaking: true,
      capacity_planning: "Full Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "1 Seat Limit",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: false,
      callsheet_email_distribution: false,
      asset_approvals: true,
      slack_integration: false,
      frameio_integration: false,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Trial (5 lines/expenses)"
    },
    marketingFeatures: [
      "1 seat & Unlimited active projects",
      "Digital call sheet builder (watermarked)",
      "View-only resource scheduler",
      "Track up to 30 resource items",
      "3 GB workspace storage"
    ]
  },
  {
    id: "solo_pro",
    name: "Solo Pro",
    price_monthly: 34,
    price_type: "flat",
    billing_cycle: "monthly",
    seats: { min: 1, max: 1, included: 1 },
    ai_credits: { monthly_quota: 600, is_per_seat: false },
    audience: "High-volume independent producers and power users.",
    features: {
      workspace_storage: "10 GB",
      active_projects: "Unlimited",
      locations: "Unlimited",
      interactive_scheduler: "Full Access",
      barcode_scanning: false,
      audit_logs_viewer: false,
      team_permissions: "10 Custom Roles",
      transit_buffers: false,
      return_inspections: false,
      repair_lockouts: false,
      sso_scim: false,
      manual_projects: true,
      brief_analyzer: true,
      intake_forms: false,
      form_mapping: false,
      domain_gating: false,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: true,
      talent_search: false,
      ai_matchmaking: true,
      capacity_planning: "Full Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "1 Seat Limit",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: true,
      callsheet_email_distribution: true,
      asset_approvals: true,
      slack_integration: true,
      frameio_integration: true,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Full Access"
    },
    marketingFeatures: [
      "1 seat & Unlimited active projects",
      "Crew roster management & invitations",
      "Watermark-free PDF exports",
      "Call sheet email distribution to crew",
      "Interactive resource scheduler",
      "AI production brief parser",
      "Google & Outlook calendar sync",
      "Frame.io & Slack integrations",
      "10 GB workspace storage"
    ]
  },
  {
    id: "team",
    name: "Team",
    price_monthly: 39,
    price_type: "per_seat",
    billing_cycle: "monthly",
    seats: { min: 2, max: 5, included: 2 },
    ai_credits: { monthly_quota: 500, is_per_seat: true },
    audience: "Boutique creative agencies, design shops, and small production teams.",
    features: {
      workspace_storage: "10 GB",
      active_projects: "Unlimited",
      locations: "Unlimited",
      interactive_scheduler: "Full Access",
      barcode_scanning: true,
      audit_logs_viewer: false,
      team_permissions: "15 Custom Roles",
      transit_buffers: true,
      return_inspections: true,
      repair_lockouts: true,
      sso_scim: false,
      manual_projects: true,
      brief_analyzer: true,
      intake_forms: "1 Active Form",
      form_mapping: true,
      domain_gating: true,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: true,
      talent_search: true,
      ai_matchmaking: true,
      capacity_planning: "Full Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "Up to 5 Seats",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: true,
      callsheet_email_distribution: true,
      asset_approvals: true,
      slack_integration: true,
      frameio_integration: true,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Full Access"
    },
    marketingFeatures: [
      "2 – 5 team seats",
      "Collaborative team workspace",
      "Unlimited active projects",
      "Interactive resource scheduler & templates",
      "Watermark-free PDF exports & distribution",
      "Role-based member permissions",
      "1 Active Custom Intake Form",
      "AI production brief parser",
      "Advanced Logistics & Operations settings",
      "Barcode Equipment Scanning",
      "Frame.io & Slack integrations",
      "10 GB workspace storage"
    ]
  },
  {
    id: "studio",
    name: "Studio",
    price_monthly: 49,
    price_type: "per_seat",
    billing_cycle: "monthly",
    seats: { min: 6, max: 20, included: 6 },
    ai_credits: { monthly_quota: 1000, is_per_seat: true },
    audience: "Commercial production companies, post houses, and agencies.",
    features: {
      workspace_storage: "15 GB",
      active_projects: "Unlimited",
      locations: "Unlimited",
      interactive_scheduler: "Full Access",
      barcode_scanning: true,
      audit_logs_viewer: false,
      team_permissions: "30 Custom Roles",
      transit_buffers: true,
      return_inspections: true,
      repair_lockouts: true,
      sso_scim: false,
      manual_projects: true,
      brief_analyzer: true,
      intake_forms: "Unlimited Forms",
      form_mapping: true,
      domain_gating: true,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: true,
      talent_search: true,
      ai_matchmaking: true,
      capacity_planning: "Full Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "Up to 20 Seats",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: true,
      callsheet_email_distribution: true,
      asset_approvals: true,
      slack_integration: true,
      frameio_integration: true,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Full Access"
    },
    marketingFeatures: [
      "6 – 20 team seats",
      "Collaborative studio workspace",
      "Unlimited active projects",
      "Interactive resource scheduler & templates",
      "Watermark-free PDF exports & distribution",
      "Production calendar & calendar sync",
      "Unlimited project request forms",
      "AI production brief parser",
      "Advanced Logistics & Operations settings",
      "Barcode Equipment Scanning",
      "Frame.io & Slack integrations",
      "15 GB workspace storage"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_monthly: null,
    price_type: "custom",
    billing_cycle: "monthly",
    seats: { min: 21, max: null, included: 21 },
    ai_credits: { monthly_quota: -2, is_per_seat: false, custom: true },
    audience: "Enterprise agencies, media networks, and large studio facilities.",
    features: {
      workspace_storage: "Custom (100 GB base)",
      active_projects: "Unlimited",
      locations: "Unlimited",
      interactive_scheduler: "Full Access",
      barcode_scanning: true,
      audit_logs_viewer: true,
      team_permissions: "Unlimited Roles",
      transit_buffers: true,
      return_inspections: true,
      repair_lockouts: true,
      sso_scim: true,
      manual_projects: true,
      brief_analyzer: true,
      intake_forms: "Unlimited Forms",
      form_mapping: true,
      domain_gating: true,
      personal_calendar: true,
      integrated_timesheets: true,
      calendar_sync: true,
      talent_search: true,
      ai_matchmaking: true,
      capacity_planning: "Full Dashboard",
      conflict_alerts: "Booking Conflicts Only",
      external_invites: "Unlimited Seats",
      file_sharing: "Basic File Sharing (No Comments)",
      callsheet_pdf_export: true,
      callsheet_email_distribution: true,
      asset_approvals: true,
      slack_integration: true,
      frameio_integration: true,
      stripe_express: true,
      invoicing: true,
      financial_dashboard: true,
      po_holds: true,
      budgeting_access: "Full Access"
    },
    marketingFeatures: [
      "Unlimited team seats",
      "Dedicated corporate workspace",
      "Unlimited active projects",
      "Custom storage limits (100 GB base)",
      "Custom AI credits",
      "Advanced Logistics & Operations settings",
      "Barcode Equipment Scanning",
      "Frame.io & Slack integrations",
      "Compliance Audit Logs & Viewer",
      "SSO & Directory Sync (SAML/SCIM)"
    ]
  }
];

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Workspace & Logistics
  active_projects: "The number of projects that can be concurrently managed, scheduled, and active in your workspace.",
  workspace_storage: "Total cloud storage capacity allowed for project assets, files, and workspace media.",
  locations: "Distinct geographic hubs or physical equipment lockup locations supported within a single workspace.",
  interactive_scheduler: "Access levels for the interactive stripboard calendar. Read-only for Free/Solo Lite; full drag-and-drop, AI Sort, Sync Crew, and breaks for higher tiers.",
  barcode_scanning: "Camera-based barcode scanning to process physical equipment check-ins, check-outs, and inventory tracking.",
  audit_logs_viewer: "Granular activity logs and compliance history tracking member, permission, and workspace modifications.",
  team_permissions: "Granular role-based access controls to manage view/edit permissions for staff, crew, and clients.",
  transit_buffers: "Automated scheduling buffers added before and after bookings to account for crew travel and gear transport.",
  return_inspections: "Structured check-in checklists and digital sign-offs to assess equipment health immediately upon return.",
  repair_lockouts: "Automated system that locks damaged gear out of future bookings until a repair status is resolved.",
  sso_scim: "Enterprise identity management supporting Single Sign-On and automated user provisioning via SAML and SCIM.",
  ai_credits: "Monthly quota of AI credits to power Brief Intelligence parsing and co-pilot matchmaking recommendations.",

  // Intake & Project Setup
  manual_projects: "Create new project files manually with custom parameters, timelines, and crew allocations.",
  brief_analyzer: "AI-powered parsing of creative briefs to automatically extract deliverables, timelines, and talent roles.",
  intake_forms: "Tailored request forms to collect project requirements, client needs, and timeline details directly.",
  form_mapping: "Automatically translate incoming intake responses into matching roster skills and gear requirements.",
  domain_gating: "Restrict workspace entry or form submissions to specific authorized corporate email domains.",

  // Crewing & Utilization
  personal_calendar: "A dedicated dashboard for individual team members to track assignments, availability, and off-days.",
  integrated_timesheets: "Dynamic time tracking logging billable hours and off-days directly against task assignments and project milestones.",
  calendar_sync: "Bi-directional integration syncing system bookings to personal Google Calendar or Microsoft Outlook schedules.",
  talent_search: "Filter and search your vetted database of crew, contractors, and internal talent by skill, rate, and location.",
  ai_matchmaking: "Intelligent suggestions recommending the best-fit crew members for a project based on skills, availability, and past roles.",
  capacity_planning: "A high-level grid view displaying team-wide bandwidth, active bookings, and utilization rates over time.",
  conflict_alerts: "Real-time warnings indicating double-bookings, expired certs, or scheduling overlaps for crew and gear.",
  external_invites: "Invite external crew members or agency contractors to join a specific project roster without full workspace access.",

  // Integrations & Collaboration
  file_sharing: "Upload mood boards, briefs, and call sheets with threaded comment streams for collaborative planning.",
  callsheet_pdf_export: "Generate clean, print-ready, unwatermarked PDF call sheets and summaries for physical set distribution.",
  callsheet_email_distribution: "Directly email digital call sheets, schedules, and location coordinates to the entire active crew roster in one click.",
  asset_approvals: "Structured workflow for client sign-offs, feedback rounds, and status tracking of creative deliverables.",
  slack_integration: "Automated notifications to Slack channels for project updates, booking confirmations, and crew alerts.",
  frameio_integration: "Connect project files and timeline reviews directly with Frame.io review links and status updates.",

  // Financials & Payments
  stripe_express: "Simplified dashboard enabling crew members and contractors to securely link bank accounts for direct payout.",
  invoicing: "Generate professional invoices automatically from tracked time, rates, and budgets, with direct bank payouts.",
  financial_dashboard: "A secure pane tracking project budgets, pending invoices, approved expenses, and historical payouts.",
  po_holds: "Pre-authorize and hold project budgets on client cards for 7 days to guarantee payment before production kick-off.",
  budgeting_access: "Advanced Budgeting limits: trial access (up to 5 line items and 5 expenses) for Free/Solo Lite; unlimited items and expenses for higher tiers."
};

export default function PricingClient() {
  // Plan filter state ("solo" vs "team")
  const [planFilter, setPlanFilter] = useState<"solo" | "team">("solo");

  // States for dynamic seat counters
  const [teamSeats, setTeamSeats] = useState<number>(2);
  const [studioSeats, setStudioSeats] = useState<number>(6);

  // Filter plans dynamically based on toggle selection
  const filteredPlans = PLANS.filter((plan) => 
    planFilter === "solo" 
      ? ["free", "solo_lite", "solo_pro"].includes(plan.id) 
      : ["team", "studio", "enterprise"].includes(plan.id)
  );

  // States for collapsible categories in feature matrix
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Workspace & Logistics": true,
    "Intake & Project Setup": true,
    "Crewing & Utilization": true,
    "Integrations & Collaboration": true,
    "Financials & Payments": true
  });

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const toggleFeatureDescription = (featId: string) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [featId]: !prev[featId]
    }));
  };

  const getDynamicPrice = (plan: Plan): number | string => {
    if (plan.price_type === "custom" || plan.price_monthly === null) {
      return "Custom";
    }
    return plan.price_monthly;
  };

  const getDynamicAICredits = (plan: Plan): string => {
    if (plan.ai_credits.custom) {
      return "Custom";
    }
    if (plan.ai_credits.unlimited) {
      return "Unlimited";
    }
    if (plan.ai_credits.monthly_quota === 0) {
      return "None";
    }
    if (plan.ai_credits.is_per_seat) {
      return `${plan.ai_credits.monthly_quota.toLocaleString()} credits/mo per seat`;
    }
    return `${plan.ai_credits.monthly_quota.toLocaleString()} credits/mo`;
  };

  const renderFeatureValue = (val: boolean | string) => {
    if (typeof val === "boolean") {
      return val ? (
        <div className="flex justify-center">
          <div className="w-5 h-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Minus className="w-3.5 h-3.5 text-zinc-700 font-mono" />
        </div>
      );
    }
    return (
      <span className="text-zinc-200 text-xs font-medium px-2 py-0.5 bg-zinc-950/40 rounded border border-white/5 inline-block max-w-full truncate">
        {val}
      </span>
    );
  };

  return (
    <div className="relative w-full overflow-hidden bg-abram-black min-h-screen font-sans pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Decorative Radial Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950/0 to-zinc-950 pointer-events-none z-0" />
      
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16 md:gap-24 relative z-10">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3">
            PLANS & CAPABILITIES
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white mb-6 max-w-3xl leading-none">
            Transparent, scalable pricing.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Choose the right subscription for your creative operations. Dynamic seat configurations, clear credit top-ups, and flat transaction rates.
          </p>
        </section>

        {/* Plan Filter Toggle Selector */}
        <div className="lg:hidden flex justify-center -mt-6 -mb-4">
          <div className="flex p-1 bg-zinc-950/60 backdrop-blur-md rounded-full border border-white/5 relative z-20">
            <button
              onClick={() => setPlanFilter("solo")}
              className={`h-11 px-6 flex items-center justify-center rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                planFilter === "solo"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Solo Plans
            </button>
            <button
              onClick={() => setPlanFilter("team")}
              className={`h-11 px-6 flex items-center justify-center rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                planFilter === "team"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Team Plans
            </button>
          </div>
        </div>

        {/* Carousel Track Section */}
        <section className="flex flex-col gap-4">
          {/* Scroll hint on mobile */}
          <div className="md:hidden flex items-center justify-center gap-1.5 text-xs text-zinc-500 mb-2">
            <span>Swipe horizontally to explore plans</span>
            <ArrowRight className="w-3 h-3 animate-pulse" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={planFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full lg:grid lg:grid-cols-[280px_1fr_1fr_1fr] lg:gap-0 lg:max-w-[1400px] lg:mx-auto lg:overflow-x-visible lg:pb-0"
            >
              <div className="hidden lg:flex flex-col justify-center items-center gap-4 w-[280px] h-full">
                <button
                  onClick={() => setPlanFilter("solo")}
                  className={`w-44 h-24 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none flex items-center justify-between p-5 border group relative overflow-hidden ${
                    planFilter === "solo"
                      ? "bg-white/10 border-white/20 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <span className="text-left font-sans">
                    Solo
                    <span className="block text-[10px] text-zinc-500 font-medium tracking-wider uppercase mt-1">Plans</span>
                  </span>
                  <User className={`w-5 h-5 shrink-0 transition-colors ${planFilter === "solo" ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                </button>
                <button
                  onClick={() => setPlanFilter("team")}
                  className={`w-44 h-24 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none flex items-center justify-between p-5 border group relative overflow-hidden ${
                    planFilter === "team"
                      ? "bg-white/10 border-white/20 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <span className="text-left font-sans">
                    Team
                    <span className="block text-[10px] text-zinc-500 font-medium tracking-wider uppercase mt-1">Plans</span>
                  </span>
                  <Users className={`w-5 h-5 shrink-0 transition-colors ${planFilter === "team" ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                </button>
              </div>
              {filteredPlans.map((plan) => {
                const isSoloPro = plan.id === "solo_pro";
                const isTeam = plan.id === "team";
                const isStudio = plan.id === "studio";
                const isPrimaryCard = isSoloPro || isTeam || isStudio;
                
                const minSeats = plan.seats.min;
                const maxSeats = plan.seats.max || 20;
                const currentSeats = isTeam ? teamSeats : isStudio ? studioSeats : plan.seats.included;
                const priceMonthly = plan.price_monthly;
                
                const isCustom = plan.price_type === "custom" || priceMonthly === null;
                const isPerSeat = plan.price_type === "per_seat";

                return (
                  <div key={plan.id} className="snap-start shrink-0 lg:snap-none lg:shrink lg:w-full lg:px-4 lg:min-w-0 h-full">
                    <div 
                      className={`flex flex-col justify-between p-6 lg:p-5 xl:p-6 rounded-2xl w-[calc(100vw-3rem)] max-w-[310px] sm:w-[310px] sm:min-w-[310px] lg:w-full h-full transition-all duration-300 relative group ${
                        isPrimaryCard 
                          ? "border-2 border-white/10 bg-zinc-950/40 shadow-[0_4px_30px_rgba(255,255,255,0.02)]" 
                          : "border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10"
                      }`}
                    >
                    {/* Glowing Edge Indicator for Primary cards */}
                    {isPrimaryCard && (
                      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}

                    <div>
                      {/* Header */}
                      <div className="flex flex-col gap-1 mb-2 lg:mb-1.5">
                        {isSoloPro ? (
                          <span className="w-fit text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/10">
                            Popular
                          </span>
                        ) : isTeam ? (
                          <span className="w-fit text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-[#8ECAFF] px-2 py-0.5 rounded-full border border-white/10">
                            Agency Pick
                          </span>
                        ) : (
                          <span className="w-fit text-[9px] font-semibold tracking-wider uppercase border border-transparent select-none invisible px-2 py-0.5">
                            Placeholder
                          </span>
                        )}
                        <h2 className="text-lg lg:text-base xl:text-lg font-semibold tracking-tight text-white">
                          {plan.name}
                        </h2>
                      </div>
                      <p className="text-xs lg:text-xs leading-relaxed text-zinc-500 h-10 lg:h-12 line-clamp-3 mb-6 lg:mb-4">
                        {plan.audience}
                      </p>
   
                      {/* Price and Seat description */}
                      <div className="flex flex-col gap-1 mb-6 lg:mb-4 border-b border-white/5 pb-6 lg:pb-4">
                        {isCustom ? (
                          <div className="h-10 lg:h-8 flex items-center">
                            <span className="text-2xl lg:text-lg xl:text-xl font-semibold text-white tracking-tight">Custom Rates</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-0.5 h-10 lg:h-8 flex-wrap">
                            <span className="text-2xl lg:text-lg xl:text-xl font-bold font-mono text-zinc-50">$</span>
                            <span className="text-4xl lg:text-3xl xl:text-4xl font-bold font-mono text-white tracking-tight">
                              {getDynamicPrice(plan)}
                            </span>
                            <span className="text-xs lg:text-[10px] xl:text-xs text-zinc-500 font-sans ml-1">
                              {isPerSeat ? "/ seat / mo" : "/ mo"}
                            </span>
                          </div>
                        )}
   
                        {/* Seat counter indicator */}
                        {!isCustom && (
                          <div className="text-xs lg:text-[10px] xl:text-xs text-zinc-400 font-sans mt-1.5">
                            {isPerSeat ? (
                              <>
                                Total: <span className="font-mono text-zinc-200 font-semibold">${currentSeats * (priceMonthly ?? 0)}</span>/mo • <span className="font-mono text-zinc-200 font-semibold">{(currentSeats * plan.ai_credits.monthly_quota).toLocaleString()}</span> credits ({currentSeats} seats)
                              </>
                            ) : (
                              <>
                                Flat rate <span className="text-zinc-500 lg:hidden xl:inline-flex">• 1 Seat</span>
                              </>
                            )}
                          </div>
                        )}
                        {isCustom && (
                          <div className="text-xs lg:text-[10px] xl:text-xs text-zinc-400 font-sans mt-1.5">
                            Requires 21+ seats scale
                          </div>
                        )}
                      </div>
   
                      {/* Dynamic seat sliders */}
                      {(isTeam || isStudio) && (
                        <div className="mb-6 lg:mb-4 p-3.5 lg:p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                          {/* Mobile view: Slider track with minus/plus */}
                          <div className="lg:hidden">
                            <div className="flex justify-between items-center text-[10px] text-zinc-300 mb-2">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-zinc-400" />
                                Seats: <strong className="text-white font-mono">{currentSeats}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (isTeam) setTeamSeats(Math.max(minSeats, teamSeats - 1));
                                  if (isStudio) setStudioSeats(Math.max(minSeats, studioSeats - 1));
                                }}
                                className="w-11 h-11 rounded-full border border-white/10 hover:border-white/20 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                disabled={currentSeats === minSeats}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="range"
                                min={minSeats}
                                max={maxSeats}
                                value={currentSeats}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (isTeam) setTeamSeats(val);
                                  if (isStudio) setStudioSeats(val);
                                }}
                                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white min-w-0"
                              />
                              <button
                                onClick={() => {
                                  if (isTeam) setTeamSeats(Math.min(maxSeats, teamSeats + 1));
                                  if (isStudio) setStudioSeats(Math.min(maxSeats, studioSeats + 1));
                                }}
                                className="w-11 h-11 rounded-full border border-white/10 hover:border-white/20 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                disabled={currentSeats === maxSeats}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
  
                          {/* Desktop view: Tighter, no slider track, pure click counter */}
                          <div className="hidden lg:flex items-center justify-between gap-1 w-full">
                            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Seats:</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (isTeam) setTeamSeats(Math.max(minSeats, teamSeats - 1));
                                  if (isStudio) setStudioSeats(Math.max(minSeats, studioSeats - 1));
                                }}
                                className="w-5 h-5 rounded-full border border-white/10 hover:border-white/20 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                disabled={currentSeats === minSeats}
                              >
                                <Minus className="w-2 h-2" />
                              </button>
                              <span className="font-mono text-xs text-white font-bold w-4 text-center select-none">
                                {currentSeats}
                              </span>
                              <button
                                onClick={() => {
                                  if (isTeam) setTeamSeats(Math.min(maxSeats, teamSeats + 1));
                                  if (isStudio) setStudioSeats(Math.min(maxSeats, studioSeats + 1));
                                }}
                                className="w-5 h-5 rounded-full border border-white/10 hover:border-white/20 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                disabled={currentSeats === maxSeats}
                              >
                                <Plus className="w-2 h-2" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
  
                      {/* AI Credits Badge */}
                      <div className="mb-6 lg:mb-4 p-3 lg:p-2.5 rounded-xl bg-zinc-950/30 border border-white/5 flex items-center gap-2 lg:gap-1">
                        <Sparkles className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-zinc-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] lg:text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">AI Credits</span>
                          <span className="text-xs lg:text-xs text-zinc-200 font-medium font-mono leading-tight">{getDynamicAICredits(plan)}</span>
                        </div>
                      </div>
  
                      {/* Bullet List for quick review */}
                      <ul className="space-y-2.5 lg:space-y-2 mb-8 lg:mb-4">
                        {plan.marketingFeatures.map((mFeature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm lg:text-xs xl:text-sm text-zinc-400">
                            <Check className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#8ECAFF] shrink-0 mt-0.5" />
                            <span>{mFeature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto">
                      <button 
                        className={`w-full min-h-[44px] lg:min-h-0 py-3 lg:py-1.5 text-xs font-semibold ${
                          isPrimaryCard ? "btn-primary" : "btn-glass"
                        }`}
                      >
                        {plan.id === "enterprise" ? "Contact Sales" : "Get Started"}
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Feature Comparison Matrix Accordion */}
        <section className="flex flex-col gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Compare all features
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Analyze structural limits, intake mechanisms, internal utilization schedules, and payout options.
            </p>
          </div>

          {/* Swipe indicator for tables on mobile */}
          <div className="md:hidden flex items-center justify-between gap-1.5 text-xs text-zinc-500 bg-zinc-950/40 border border-white/5 py-2.5 px-3.5 rounded-xl">
            <span className="font-medium">Table continues horizontally</span>
            <div className="flex items-center gap-1">
              <span className="animate-pulse">←</span> Swipe to scroll <span className="animate-pulse">→</span>
            </div>
          </div>

          {/* Comparison Table Container */}
          <div
            className="overflow-x-auto lg:overflow-x-hidden w-full lg:max-w-[1400px] lg:mx-auto border border-white/5 rounded-2xl bg-zinc-950/10 backdrop-blur-md"
          >
            <table className="w-full min-w-[520px] md:min-w-[660px] lg:min-w-0 border-collapse table-fixed">
              <colgroup>
                <col className="w-[160px] md:w-[280px]" />
                <col className="w-[120px] md:w-auto" />
                <col className="w-[120px] md:w-auto" />
                <col className="w-[120px] md:w-auto" />
              </colgroup>
              <thead>
                <tr className="sticky top-16 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-white/10">
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-4 py-4 sticky left-0 bg-zinc-950/95 border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                    Capabilities
                  </th>
                  {filteredPlans.map((plan) => {
                    const priceVal = getDynamicPrice(plan);
                    const isPerSeat = plan.price_type === "per_seat";
                    const currentSeats = plan.id === "team" ? teamSeats : plan.id === "studio" ? studioSeats : null;
                    const dispPrice = typeof priceVal === "number"
                      ? (isPerSeat ? `$${priceVal}/seat/mo` : `$${priceVal}/mo`)
                      : priceVal;
                    
                    return (
                      <th key={plan.id} className="py-4 px-3 text-center">
                        <div className="text-xs font-bold text-white whitespace-nowrap">
                          {plan.name.replace("ABRAM ", "")}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {dispPrice}
                        </div>
                        {isPerSeat && currentSeats !== null && (
                          <div className="text-[9px] text-zinc-600 font-sans mt-0.5 font-normal">
                            {currentSeats} seats
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {FEATURES_SCHEMA.map((cat) => {
                  const isExpanded = expandedCategories[cat.category];
                  return (
                    <React.Fragment key={cat.category}>
                      {/* Accordion Category Header */}
                      <tr 
                        onClick={() => toggleCategory(cat.category)}
                        className="cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/40 border-y border-white/5 transition-colors select-none py-4"
                      >
                        <td colSpan={1 + filteredPlans.length} className="py-4 px-4 text-left sticky left-0 bg-zinc-900/70 backdrop-blur-md transition-colors border-r border-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            {cat.category}
                          </div>
                        </td>
                      </tr>
 
                      {/* Feature rows inside this Category */}
                      {isExpanded && cat.features.map((feat) => (
                        <tr 
                          key={feat.id} 
                          className="hover:bg-zinc-900/10 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <td className="py-3.5 pl-4 pr-2 text-left text-xs font-medium text-zinc-300 sticky left-0 bg-zinc-950 border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 justify-between pr-2">
                                <span 
                                  className="cursor-pointer select-none py-1.5 block flex-1"
                                  onClick={() => toggleFeatureDescription(feat.id)}
                                >
                                  {feat.name}
                                </span>
                                <div className="relative group inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleFeatureDescription(feat.id)}
                                    className="w-11 h-11 lg:w-5 lg:h-5 flex items-center justify-center bg-transparent p-0 focus:outline-none cursor-pointer -mr-2.5 lg:-mr-0.5"
                                    aria-label={`Toggle description for ${feat.name}`}
                                  >
                                    <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-help" />
                                  </button>
                                  <div className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-xl text-zinc-400 text-[10px] leading-relaxed shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 text-left font-normal font-sans">
                                    {FEATURE_DESCRIPTIONS[feat.id] || "Feature details and options."}
                                  </div>
                                </div>
                              </div>
                              {expandedFeatures[feat.id] && (
                                <div className="text-[10px] text-zinc-500 mt-1 font-normal font-sans leading-normal pr-2">
                                  {FEATURE_DESCRIPTIONS[feat.id] || "Feature details and options."}
                                </div>
                              )}
                            </div>
                          </td>
                          {filteredPlans.map((plan) => {
                            const val = feat.id === "ai_credits" ? getDynamicAICredits(plan) : plan.features[feat.id];
                            return (
                              <td key={plan.id} className="py-3.5 px-3 text-center text-xs text-zinc-400 font-sans">
                                {renderFeatureValue(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
