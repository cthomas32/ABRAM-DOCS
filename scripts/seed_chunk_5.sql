INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/ABRAM_Acceptable_Use_Policy',
        'Acceptable Use Policy',
        '',
        'Acceptable Use Policy for the ABRAM creative intelligence platform.',
        '{}'::text[],
        '---
title: Acceptable Use Policy
description: Acceptable Use Policy for the ABRAM creative intelligence platform.
---

# Acceptable Use Policy

**Effective Date:** July 27, 2026 | **Last Updated:** July 27, 2026
Thomas Abram, LLC | [legal@abram.network](mailto:legal@abram.network)

---

## 1. Purpose and Relationship to the Terms of Use

This Acceptable Use Policy ("AUP" or "Policy") sets out specific rules for how you may and may not use the ABRAM Network platform (the "Platform"). It is incorporated by reference into the ABRAM Terms of Use and forms part of the agreement between you and Thomas Abram, LLC ("ABRAM," "we," "us," or "our").

We publish this Policy separately from the Terms of Use so that we can update specific security and safety rules, including new AI abuse patterns, as they emerge, without requiring a full renegotiation of our Terms of Use or any signed agreement. Material changes affecting your rights will be communicated in accordance with Section 19 of the Terms of Use.

If anything in this Policy conflicts with the Terms of Use, the Terms of Use control.

---

## 2. Who This Policy Applies To

This Policy applies to all users of the Platform, including Clients, Contractors, organization Admins and members, and anyone accessing the Platform''s APIs, integrations, or AI features, whether through a paid subscription or a free account.

---

## 3. Platform and Marketplace Integrity

### 3.1 No Unauthorized Data Harvesting

You may not scrape, crawl, harvest, or extract data from the Platform using automated tools, bots, or scripts. This includes, without limitation, contractor portfolios, rate sheets, availability calendars, roster contact details, and any other profile information, whether your account ordinarily has access to that data or not.

### 3.2 No Circumventing Platform Fees

You may not deliberately move a relationship formed through the Platform off-Platform for the purpose of avoiding ABRAM''s processing fees, within 12 months of that relationship being formed or last engaged through the Platform. This rule exists to keep fees fair for everyone, not to prevent you from working together — if a Contractor and Client mutually decide to continue their relationship outside the Platform for reasons unrelated to fee avoidance, that is not a violation of this Policy.

### 3.3 No Misrepresentation

You may not create accounts under false identities, misrepresent your skills, availability, day rates, or organizational affiliation, or impersonate another person or company on the Platform.

---

## 4. AI Feature Usage Restrictions

ABRAM''s AI features, including the Brief Analyzer, the AI Assistant, and crew matchmaking, include built-in safety and accuracy controls. You may not attempt to undermine those controls. Specifically, you may not:

- Submit prompts, files, or inputs designed to manipulate an AI feature into ignoring its safety instructions, confidence gates, or approval requirements (commonly referred to as prompt injection);
- Attempt to extract, reconstruct, or reverse engineer the underlying AI models, system instructions, or training data used by the Platform''s AI features;
- Use bots, scripts, or other automated means to query AI features at a volume or pattern inconsistent with ordinary human use; or
- Attempt to bypass, manipulate, or falsify the metering of AI Credits or any other billing ledger control.

---

## 5. Communication and Anti-Spam Rules

### 5.1 Invitation Limits

To protect Contractors from unwanted solicitation, accounts may not send more than 10 external freelancer invitations per day. ABRAM may adjust this limit at its discretion and may apply lower limits to accounts showing patterns of abuse.

### 5.2 No Unsolicited Bulk Messaging

You may not use Platform messaging, project invitations, or any other communication channel to send unsolicited bulk messages, advertising, or solicitations unrelated to a genuine project inquiry.

### 5.3 No Off-Platform Solicitation to Avoid Fees

You may not use Platform messaging to direct another user to communicate, contract, or transact outside the Platform for the purpose of avoiding fees described in the Terms of Use.

---

## 6. Security Research and Responsible Disclosure

If you believe you have found a security vulnerability in the Platform, please report it to [legal@abram.network](mailto:legal@abram.network) before taking any further action. Good-faith security research conducted under a written authorization from ABRAM is not a violation of this Policy. Unauthorized penetration testing, vulnerability scanning, or attempts to access non-public systems or other users'' data are violations of this Policy regardless of intent.

---

## 7. Enforcement

Violations of this Policy may result in warnings, feature restrictions, suspension, or termination of your account, at ABRAM''s discretion and in accordance with the Terms of Use. ABRAM may also remove content, revoke API or integration access, or take other action reasonably necessary to protect the Platform and its users. Significant violations, including fraud, data theft, or attempts to bypass billing controls, may be reported to law enforcement.

---

## 8. Reporting Violations

If you become aware of a violation of this Policy, including suspected scraping, AI abuse, or fee circumvention, please report it to [legal@abram.network](mailto:legal@abram.network).

---

## 9. Changes to This Policy

ABRAM may update this Policy to address new abuse patterns, security risks, or platform features. We will post the updated Policy with a new "Last Updated" date. Material changes affecting your rights will be communicated in accordance with Section 19 of the Terms of Use.

---

## 10. Contact

**Thomas Abram, LLC**

Email: [legal@abram.network](mailto:legal@abram.network)
Address: Washington, DC

---

© 2026 Thomas Abram, LLC. All rights reserved.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/ABRAM_Privacy_Policy',
        'Privacy Policy',
        '',
        'Privacy Policy for the ABRAM creative intelligence platform.',
        '{}'::text[],
        '---
title: Privacy Policy
description: Privacy Policy for the ABRAM creative intelligence platform.
---

# Privacy Policy

**Effective Date:** July 27, 2026 | **Last Updated:** July 27, 2026
Thomas Abram, LLC | [privacy@abram.network](mailto:privacy@abram.network)

---

## 1. Overview

Thomas Abram, LLC ("ABRAM," "we," "us," or "our") operates the ABRAM creative intelligence platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Platform.

We comply with applicable privacy laws, including the GDPR (EU/EEA), UK GDPR, CCPA (California), and applicable US state privacy laws.

---

## 2. Information We Collect

### 2.1 Information You Provide

- **Account information:** Name, email address, role (Client/Contractor), profile photo.
- **Professional profile:** Skills, experience, portfolio links, availability, hourly rates, location.
- **Resume & documents:** Uploaded resume files (parsed by AI), certifications, portfolio materials.
- **Project information:** Project briefs, deliverables, work orders, call sheets, run-of-shows.
- **Financial information:** Bank account details (via Stripe), billing information, invoices, transaction records.
- **Communications:** Messages, invitations, and notifications sent through the Platform.

### 2.2 Information Collected Automatically

- **Usage data:** Pages visited, features used, time spent, click patterns.
- **Device & technical data:** IP address, browser type, operating system, device identifiers.
- **Calendar data:** Events and availability from connected calendars (Google/Microsoft).
- **Log data:** Error logs and API call logs processed via Sentry for error monitoring.

### 2.3 Log Data and Diagnostics (Crash Reports)

When you encounter an error or crash while using the Platform, we automatically collect diagnostic information ("Crash Reports"). This includes your web browser type, operating system, preferred language, screen dimensions, the exact page URL you were visiting, the error message, and a technical stack trace. If you are logged into your account, this diagnostic data may be associated with your User ID to help our team debug and resolve the issue.

Crash Report data may also include React component tree information captured at the time of the error, which could in limited circumstances contain data you had entered immediately before the crash. We process this data solely to identify, diagnose, and resolve technical issues. This data is processed under Legitimate Interest (GDPR Article 6(1)(f)) as described in Section 3.

### 2.4 Information From Third Parties

- **WorkOS:** Authentication identity, organization membership, SSO session data.
- **Stripe:** Payment confirmation, payout status, account verification status.
- **Frame.io:** Project and media asset metadata when Frame.io is connected.
- **Slack:** Workspace identity when Slack notifications are enabled.

---

## 3. How We Use Your Information

We use your information for the following purposes. Where ABRAM relies on legitimate interest as a legal basis, we have conducted and documented a Legitimate Interest Assessment (LIA) confirming our interests are not overridden by your rights. You may request a copy by contacting privacy@abram.network.

| Purpose | Legal Basis (GDPR) |
|---|---|
| Operate and provide the Platform | Contractual necessity |
| Process payments and payouts | Contractual necessity |
| Send transactional emails and notifications | Contractual necessity |
| AI-powered matching and recommendations | Contractual necessity / Legitimate interest |
| Train and improve AI models | Separate opt-in consent (NOT bundled with Terms) |
| Calendar sync and scheduling features | Consent (at integration connection) |
| Third-party integrations (Frame.io, Slack) | Consent (at integration connection) |
| Monitor for fraud and security threats | Legitimate interest (LIA on file) |
| Diagnostics, crash reports, error monitoring | Legitimate interest — Art. 6(1)(f) GDPR (LIA on file) |
| Analytics and Platform improvement | Legitimate interest (LIA on file) |
| Comply with legal obligations | Legal obligation |

---

## 4. AI & Automated Processing

**ABRAM uses artificial intelligence and automated processing as core functions of the Platform.**

### 4.1 What We Process With AI

Your data may be processed by AI systems to: parse your resume to extract skills and attributes; analyze project briefs; match you to projects or contractors; generate call sheets, run-of-shows, and project summaries; power the ABRAM AI Assistant; and index documents into your organization''s knowledge base.

### 4.2 Company Brain (Private Organizational Knowledge)

Your organization''s Company Brain is a private, organization-specific knowledge base. Data uploaded to the Company Brain:

- is not shared with other users or organizations;
- is never used to train ABRAM''s shared AI models regardless of your AI training consent setting; and
- is stored and processed solely to power AI features within your organization''s account.

### 4.3 Automated Decision-Making & Your Rights (GDPR Article 22)

While ABRAM''s matching and recommendation features involve automated processing, final hiring and engagement decisions are made by human users. If you believe an automated process has significantly and adversely affected you, you may contact legal@abram.network to request human review of the relevant automated output. We will respond to human review requests within 30 days.

---

## 5. Third-Party Integrations & Data Sharing

### 5.1 Service Providers and Sub-processors

We share your data with the following categories of third parties. ABRAM has executed Data Processing Agreements (DPAs) with each of the below service providers in accordance with GDPR Article 28.

| Provider | What We Share | Why |
|---|---|---|
| Stripe | Payment info, transaction data, payout details | Payment processing & payouts |
| WorkOS | User identity, organization data | Authentication & SSO |
| Sentry (Functional Software, Inc.) | Error logs, stack traces, browser/device info, User ID (where logged in) | Error monitoring and crash diagnostics |
| Frame.io | Project IDs, media file references | Video review collaboration |
| Slack | Name, notification content | In-app Slack messaging |
| Google/Microsoft | Calendar events, availability | Calendar sync |
| Resend | Email address, email content | Transactional email delivery |
| Anthropic, PBC | User inputs and context passed through AI features | AI inference for Platform features |
| Google Analytics | Usage data, page views, device & browser metadata | Platform traffic measurement & analytics |

Data shared with Anthropic, PBC is processed securely via their developer API. In accordance with Anthropic''s commercial terms, data sent via the API is not used to train or improve their models, is stored securely, and is deleted in accordance with their data retention policies.

Sentry''s privacy policy is available at sentry.io/privacy. Anthropic''s privacy policy is available at anthropic.com/privacy. Stripe''s privacy policy is available at stripe.com/privacy. Adobe/Frame.io''s privacy policy is available at adobe.com/privacy. Slack''s privacy policy is available at slack.com/trust/privacy/policy. Use of these integrations is subject to the respective third parties'' privacy policies and terms of service, and we encourage you to review them before connecting your accounts.

### 5.2 Google API Services User Data Policy Compliance

ABRAM Network’s use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.

### 5.3 Between Users

Certain profile information (name, skills, availability, profile photo, professional experience) is visible to other users for the purpose of crew matching and collaboration.

### 5.4 Legal Compliance

We may disclose your information if required by law, court order, or to protect the rights and safety of ABRAM, our users, or the public.

### 5.5 Business Transfers

If ABRAM is acquired by or merged with another company, your data may be transferred as part of that transaction. We will notify you prior to its completion.

---

## 6. Cookies & Tracking

We use Google Analytics to understand Platform usage and measure traffic. To manage cookie preferences in compliance with Google Consent Mode v2, we utilize a Consent Management Platform (CMP). Cookies are categorized as:

- **Strictly Necessary Cookies:** Required for the Platform to function (authentication, session management, security). Cannot be disabled without preventing core functionality.
- **Analytics & Performance Cookies (including Google Analytics):** Used to measure and analyze Platform traffic and usage. Require opt-in consent.
- **Third-Party / Integration Cookies (including Sentry):** Set by integrated tools such as telemetry and diagnostic providers. Require opt-in consent.

We do not use advertising cookies or behavioral tracking cookies for marketing purposes.

Under our Google Consent Mode v2 configuration, all optional consent parameters (`ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage`) default to a ''denied'' state unless the user explicitly grants consent in the cookie banner. These optional categories are only activated if you choose to opt in. Upon your first visit, a cookie consent banner will be displayed. You may Accept All, Reject All, or manage and customize preferences by category. Accept and Reject options are presented with equal visual prominence, and no optional categories are pre-selected. Your consent preferences are saved in your browser''s local storage (`localStorage`) and can be updated or revoked at any time via the ''Cookie Settings'' button in the footer.

---

## 7. Data Retention

| Data Type | Retention Period |
|---|---|
| Personal profile data | Until account deletion, then deleted within 30 days |
| Resume files and uploaded documents | Until deleted by user or upon account deletion |
| Project data | Retained while active; deleted upon account deletion |
| Financial & transaction records | 7 years (anonymized) for legal and tax compliance |
| AI chat session data | 90 days, then deleted |
| Crash reports / diagnostic logs | 30 days |
| Log and error data | 30 days |
| AI training consent records | Account lifetime + 3 years (regulatory compliance evidence) |
| Cookie consent records | 3 years (regulatory compliance evidence) |
| Calendar sync data | Deleted upon integration disconnect or account deletion |

You may request account deletion through your account settings or by contacting legal@abram.network. Personal data will be deleted within 30 days of the request. You may request an export of your personal data at any time through your account settings.

---

## 8. Your Rights

### 8.1 For All Users

- **Access:** Request a copy of the personal data we hold about you.
- **Correction:** Request correction of inaccurate or incomplete data.
- **Deletion:** Request deletion of your personal data (subject to legal retention requirements).
- **Data Export / Portability:** Download your data in a portable, machine-readable format.
- **Withdraw AI Training Consent:** Withdraw at any time through account settings. Withdrawal is prospective only.

### 8.2 Additional Rights for EU/EEA Users (GDPR)

- **Object to Processing:** Object to processing based on legitimate interests.
- **Restrict Processing:** Request restriction of processing while a dispute is resolved.
- **Automated Decision Rights:** Request human review of automated processing that significantly affects you (Section 4.3).
- **Lodge a Complaint:** With your national Data Protection Authority — see edpb.europa.eu.

### 8.3 Additional Rights for UK Users

The same rights as EU/EEA users above apply under the UK GDPR. You may lodge a complaint with the Information Commissioner''s Office (ICO) at ico.org.uk.

### 8.4 Additional Rights for California Residents (CCPA)

- **Know:** The categories and specific pieces of personal information collected about you.
- **Delete:** Personal information we hold about you.
- **Opt-Out:** Of the sale or sharing of personal information (ABRAM does not sell personal data).
- **Non-Discrimination:** You will not be discriminated against for exercising your CCPA rights.

To exercise any of these rights, contact legal@abram.network. We will respond within 30 days (CCPA) / 1 month (GDPR).

---

## 9. Data Security

We implement the following security measures:

- Encryption of data in transit (TLS 1.2+) and at rest.
- Row-level security (RLS) on all database records via Supabase.
- Access control and permission management via WorkOS.
- Error monitoring and alerting via Sentry.
- Regular security reviews of third-party integrations.
- Least-privilege access controls for ABRAM personnel.

No method of transmission over the internet is 100% secure. While we use commercially reasonable security measures, we cannot guarantee absolute security.

---

## 10. International Data Transfers

ABRAM is based in the United States. If you are accessing the Platform from the EEA or UK, your personal data may be transferred to and processed in the United States.

We rely on the following safeguards:

- **Standard Contractual Clauses (SCCs):** We use the 2021 EU SCCs for transfers of personal data from the EEA to the United States.
- **Transfer Impact Assessments (TIAs):** Completed for each international transfer and maintained on file.
- **UK IDTA:** For transfers from the United Kingdom, we rely on the UK International Data Transfer Agreement or the UK addendum to the EU SCCs.

You may request information about our international transfer safeguards by contacting privacy@abram.network.

---

## 11. Data Breach Notification

In the event of a personal data breach, ABRAM will notify the relevant supervisory authority within 72 hours where required by GDPR Article 33 or applicable US state law, and will notify affected individuals without undue delay where the breach is likely to result in high risk to their rights and freedoms. All breaches are documented in ABRAM''s internal breach register.

Report a potential breach: legal@abram.network

---

## 12. Children''s Privacy

The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. Contact legal@abram.network if you believe we have collected data from a minor.

---

## 13. Changes to This Policy

We will notify you of material changes via email and/or in-app notification at least 30 days before changes take effect. Where changes require new consent, we will obtain that consent separately. Continued use of the Platform after the effective date constitutes acceptance of the revised Policy.

---

## 14. Contact & Data Controller

**Data Controller: Thomas Abram, LLC**

| Contact | Email |
|---|---|
| Legal & Terms | legal@abram.network |
| Privacy Inquiries | privacy@abram.network |
| Security / Breach Reports | legal@abram.network |

**Address:** Washington, DC

**EU Data Protection Representative (GDPR Article 27):** Thomas Abram, LLC is in the process of appointing an EU representative. In the interim, contact privacy@abram.network.

For GDPR-related complaints, EU/EEA users may contact their national Data Protection Authority (edpb.europa.eu). UK users may contact the ICO at ico.org.uk.

---

© 2026 Thomas Abram, LLC. All rights reserved.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/ABRAM_Terms_of_Use',
        'Terms of Use',
        '',
        'Terms of Use for the ABRAM creative intelligence platform.',
        '{}'::text[],
        '---
title: Terms of Use
description: Terms of Use for the ABRAM creative intelligence platform.
---

# Terms of Use

**Effective Date:** July 27, 2026 | **Last Updated:** July 27, 2026
Thomas Abram, LLC | [legal@abram.network](mailto:legal@abram.network)

---

## 1. Acceptance of Terms

By accessing or using the ABRAM Network platform (the "Platform," available at app.abram.network and abram.network), you agree to be bound by these Terms of Use ("Terms"). If you do not agree, you must not access or use the Platform.

If you are accessing the Platform on behalf of an organization (a "Company Account"), you represent that you have authority to bind that organization, and these Terms apply to both you individually and the organization.

These Terms constitute a legally binding agreement between you and Thomas Abram, LLC ("ABRAM," "we," "us," or "our").

---

## 2. What Is ABRAM

ABRAM is a creative intelligence platform that provides production management, AI-assisted crew assembly, project management tools, scheduling, financial workflows, and talent discovery for the creative and film production industries. ABRAM operates as a platform intermediary — we connect clients and contractors and provide the tools to manage those relationships, but we are not a party to any agreement made between users.

---

## 3. User Roles & Eligibility

### 3.1 Account Types

The Platform supports two primary user roles:

- **Clients:** Organizations or individuals who post production projects, discover and invite contractors, manage crew, and issue payments through the Platform.
- **Contractors:** Creative professionals or production companies who offer services, receive project invitations, complete work, and receive payouts through the Platform.

You may only register for the role that accurately describes your intended use. Misrepresenting your role is grounds for account termination.

### 3.2 Eligibility

You must be at least 18 years old and legally able to enter into contracts in your jurisdiction to use the Platform.

### 3.3 Organization Accounts

Clients and contractors may operate within a Company Account. The account administrator ("Admin") who creates or controls a Company Account:

- Accepts these Terms on behalf of the organization;
- Is responsible for the conduct of all members added to that account;
- May grant or restrict member permissions in accordance with Platform features.

Each individual member of a Company Account must also individually accept these Terms upon account creation. Both the Admin and each member are individually bound by these Terms.

---

## 4. Platform Role — ABRAM as a Marketplace Intermediary

> **IMPORTANT: ABRAM is not a party to any payment, contract, work agreement, or service engagement between Clients and Contractors.**

### 4.1 No Payment Liability

ABRAM provides payment infrastructure (including Stripe-powered invoicing and payouts) as a convenience to facilitate transactions between Clients and Contractors. ABRAM is not responsible for:

- A Client''s failure to pay a Contractor;
- A Contractor''s failure to deliver services;
- Disputes over the quality, scope, or completion of work;
- Chargeback or fraud losses arising from transactions between users.

### 4.2 No Employment Relationship

Nothing in these Terms creates an employment, agency, partnership, or joint venture relationship between ABRAM and any user. Contractors are independent professionals, not employees of ABRAM.

### 4.3 No Endorsement

ABRAM does not vet, verify, guarantee, or endorse the work quality, credentials, or legal compliance of any Contractor or Client listed on the Platform. AI-generated matches and recommendations are tools to assist decision-making — final hiring and engagement decisions are the responsibility of the parties involved.

---

## 5. Role-Specific Obligations

### 5.1 Client Obligations

As a Client, you agree to:

- Provide accurate and complete project briefs and requirements;
- Honor payment obligations for completed work orders and invoices issued through the Platform;
- Not engage Contractors discovered through ABRAM outside the Platform for the purpose of circumventing fees or agreements, subject to the time limit and terms in Section 8.6;
- Comply with all applicable employment, labor, and tax laws when engaging Contractors;
- Ensure your organization''s use of the Platform complies with these Terms.

### 5.2 Contractor Obligations

As a Contractor, you agree to:

- Maintain accurate and truthful profile information, including skills, availability, and experience;
- Honor accepted work orders and project invitations in good faith;
- Connect a valid Stripe account to receive payouts through the Platform;
- Comply with all applicable tax, labor, and licensing laws, including obligations arising from union or guild memberships (see Section 15);
- Not misrepresent your qualifications, availability, or the services you can provide.

---

## 6. AI Features & Automated Processing

### 6.1 How AI Is Used

ABRAM uses AI and machine learning to:

- Parse and analyze uploaded resumes and professional profiles;
- Extract skills and attributes from project briefs;
- Match Contractors to projects based on availability, skills, location, and other criteria;
- Generate call sheets, run-of-shows, and production documents;
- Suggest crew compositions and team structures;
- Power the ABRAM AI Assistant chatbot;
- Search and rank talent via smart search;
- Analyze project timelines, hours, and resource allocation;
- Other AI-powered features and services as ABRAM evolves the Platform.

### 6.2 AI Training Consent — Separate Opt-In

**AI training use of your data requires your separate, explicit, optional consent. Accepting these Terms does not constitute consent to AI training use of your data, and your access to and use of the Platform is not conditioned on providing such consent.**

ABRAM may request your consent to use your data (including profile information, project interactions, and platform usage patterns) to train and improve ABRAM''s AI models and algorithms. You may provide, manage, or withdraw this consent at any time through your account settings under Privacy & Consent.

Withdrawal of consent applies prospectively. Data already incorporated into trained model weights cannot be retroactively removed from those models, but no new training use of your data will occur following withdrawal of consent.

**Company Brain Exception:** Data stored in your organization''s Company Brain (private organizational knowledge base) is never used to train ABRAM''s shared AI models, regardless of your AI training consent setting.

### 6.3 AI Features: Disclaimer, Limitations, and Human Verification

(a) **Use of Advanced AI Technologies.** The Platform utilizes advanced artificial intelligence, machine learning, natural language processing, and third-party large language models (collectively, "AI Features") to assist you in production management, crew assembly, scoping, scheduling, and document generation. These features include, without limitation:
    (i) **Brief Intelligence:** Automated intake analysis extracting work packages, roles, deliverables, and estimated budgets;
    (ii) **Crew Matchmaking:** Recommendations matching contractors to project role slots based on skills, location, availability, and rates;
    (iii) **Document Generation:** Automated drafting of call sheets, run-of-shows, project summaries, and related materials; and
    (iv) **ABRAM AI Assistant:** A conversational chatbot co-pilot assisting in platform operations and database/web searches.

(b) **"As-Is" Nature of AI Outputs.** All AI-generated recommendations, matches, text, budgets, scopes, and responses (collectively, "AI Outputs") are provided to you on an **"AS-IS"** and **"AS-AVAILABLE"** basis. AI Features are experimental and probabilistic. You acknowledge and agree that AI Outputs:
    (i) May contain errors, inaccuracies, omissions, or obsolete information;
    (ii) May exhibit bias or produce inconsistent results; and
    (iii) May generate "hallucinations" (information that appears plausible or factually correct but is entirely fictitious, incorrect, or fabricated by the AI model).

(c) **Mandatory Human Review and Verification.** 
    (i) **Human-in-the-Loop Requirement:** You are solely responsible for, and must independently review, verify, and cross-check the accuracy, completeness, legality, and suitability of all AI Outputs before taking any action or relying on them in any way.
    (ii) **High-Risk Decisions:** You must not rely on AI Outputs for critical decisions without thorough human verification. This includes, but is not limited to:
        * **Financial & Budgetary Decisions:** Finalizing budgets, daily rates, payment milestones, and Stripe billing/payout allocations;
        * **Hiring & Crew Assembly:** Formally engaging contractors, signing work orders, or finalizing independent contractor classifications; and
        * **Scheduling & Logistics:** Confirming shoot dates, booking equipment, or coordinating logistics.
    (iii) **Platform Actions:** Any actions initiated through AI Features (e.g., dispatching external invitations via the chatbot, allocating credits, or provisioning folders) are executed only upon your explicit approval and are your sole legal responsibility.

### 6.4 Continuous Improvement and Evolution

You acknowledge that ABRAM is continuously developing, optimizing, and updating the Platform. AI models, algorithms, performance standards, capabilities, and parameters will evolve over time. ABRAM reserves the right to modify, replace, suspend, or update any AI Features, models, or third-party providers at any time, without prior notice, which may result in changes to the format, quality, or nature of AI Outputs.

---

## 7. Content Ownership & Licenses

### 7.1 Your Content

You retain full ownership of all content you upload to the Platform ("User Content"), including resumes, portfolio materials, project files, documents, media, and any other materials. ABRAM claims no ownership rights in your User Content.

### 7.2 License to ABRAM

By uploading User Content, you grant ABRAM a limited, worldwide, non-exclusive, royalty-free license to use, store, process, reproduce, and display your User Content solely for the purpose of operating and providing the Platform and facilitating connections between Clients and Contractors.

This license does not include the right to use your User Content — including images, video, audio, or creative work — to train any AI model. AI training use is governed exclusively by your separate, optional consent under Section 6.2.

This license terminates upon deletion of your account. Anonymized, non-attributable aggregated data may be retained for legal compliance and platform improvement purposes, but will not contain or be traceable to your User Content.

### 7.3 ABRAM''s Use of AI

ABRAM is an AI-assisted platform, not an AI system. ABRAM does not operate its own AI models. AI-powered features are powered by third-party AI providers (including Anthropic, PBC) acting as underlying technology. Your User Content may be passed to these providers as necessary to deliver Platform features, subject to their data handling terms. ABRAM does not use your User Content to train or fine-tune any AI model, including third-party models, without your separate explicit consent under Section 6.2.

### 7.4 Your Responsibility for Content

You are solely responsible for the User Content you upload. You represent and warrant that you own or have all necessary rights to upload the content and that your content does not infringe any third-party intellectual property, privacy, or publicity rights, and does not violate any applicable law.

### 7.5 Copyright Infringement — DMCA Notice & Takedown

ABRAM respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe content on the Platform infringes your copyright, please submit a written notice to legal@abram.network including:

- Identification of the copyrighted work;
- Identification of the infringing material and its location;
- Your contact information;
- A statement of good faith belief; and
- A statement under penalty of perjury that the information is accurate.

ABRAM will respond to valid notices by removing or disabling access to the identified content. Repeat infringers may have their accounts terminated.

### 7.6 ABRAM Platform IP

All Platform code, design, interfaces, trademarks, logos, proprietary workflows, and technology developed by Thomas Abram, LLC remain the exclusive property of Thomas Abram, LLC. Third-party AI models and technology integrated into the Platform (such as Anthropic''s Claude) remain the property of their respective owners.

---

## 8. Payments, Billing & Subscriptions

### 8.1 Subscription Plans

Access to certain Platform features requires a paid subscription. Subscription fees are billed in advance on a monthly or annual basis.

**Cancellation:** You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial billing periods.

**Upgrades:** Upgrades take effect immediately and are billed pro-rated for the remainder of the current billing period.

**Downgrades:** Plan downgrades and seat reductions take effect at the end of the current billing period. You retain your current plan and seat count until then, and no partial refunds or credits are issued for the reduced portion.

### 8.2 Payment Processing

All subscription payments are processed via Stripe. By providing payment information, you authorize ABRAM to charge your payment method on a recurring basis. ABRAM does not store raw payment card information.

### 8.3 Contractor Payouts

Contractors must connect a valid Stripe Connect account to receive payouts through the Platform. ABRAM is not responsible for delays caused by Stripe''s processing timelines, bank holds, or incorrect banking information provided by users.

### 8.4 Taxes

You are responsible for all applicable taxes arising from your use of the Platform and any transactions you enter into through it. ABRAM may collect and remit certain taxes where required by law.

### 8.5 AI Credits

Paid plans include a monthly allowance of AI credits, which reset at the start of each billing period and do not roll over. Trial credits granted on free accounts are one-time and may expire. AI credits have no cash value, are non-transferable, and are non-refundable. If a subscription payment fails after reasonable retry attempts, access to paid features may be suspended or downgraded to the free tier.

### 8.6 No Circumventing Platform Fees

You may not deliberately move a relationship formed through the Platform off-Platform for the purpose of avoiding ABRAM''s processing fees, within 12 months of that relationship being formed or last engaged through the Platform. This rule exists to keep fees fair for everyone, not to prevent you from working together — if a Contractor and Client mutually decide to continue their relationship outside the Platform for reasons unrelated to fee avoidance, that is not a violation of this Policy.

---

## 9. Organization & Team Management

Clients and Contractors may create or join organizational accounts enabling multi-user collaboration with granular permission controls. Admins are responsible for:

- Ensuring all members comply with these Terms;
- Managing member roles and access permissions appropriately; and
- Ensuring invitations are sent only to authorized individuals.

Admins may remove members from their organization at any time.

---

## 10. Third-Party Integrations

The Platform integrates with third-party services. When you connect a third-party account, you authorize ABRAM to exchange data with that service as necessary to provide the integration. Integrations include:

- **Stripe** (payments)
- **WorkOS** (authentication/SSO)
- **Frame.io** (video review)
- **Slack** (notifications)
- **Google/Microsoft Calendar** (scheduling)
- **Resend** (transactional email)

Use of these services is subject to their respective Terms and Privacy Policies. ABRAM has executed Data Processing Agreements with each of these service providers where required by applicable law.

### 10.1 Third-Party Trademarks & Affiliation Disclaimer

All third-party trademarks, service marks, logos, brand names, and labor union names (including but not limited to SAG-AFTRA, Frame.io, Adobe, Slack, Salesforce, and others) are the property of their respective owners. The integration with, compliance tracking for, or mention of these services, unions, or rules does not imply any affiliation with, endorsement by, or sponsorship from their respective owners or organizations (such as Screen Actors Guild-American Federation of Television and Radio Artists for SAG-AFTRA, Adobe Inc. for Frame.io, or Slack Technologies, LLC / Salesforce, Inc. for Slack). These integrations and indicators are provided "as-is" and "as-available" without warranties of any kind. You acknowledge that we are not responsible for the performance, reliability, availability, or security of any third-party services, and your use of them is subject to their respective terms and policies.

---

## 11. Prohibited Conduct

You agree not to:

- Circumvent or misuse the Platform''s matching or discovery tools;
- Upload false, misleading, or fraudulent profile or project information;
- Engage in harassment, discrimination, or abusive conduct toward other users;
- Attempt to access another user''s account without authorization;
- Reverse engineer, scrape, or extract data from the Platform;
- Upload malware, viruses, or malicious code;
- Use the Platform for any unlawful purpose;
- Violate any applicable intellectual property rights.

---

## 12. Platform Availability, Maintenance & Diagnostics

### 12.1 Availability

ABRAM strives to maintain Platform availability but does not guarantee uninterrupted access. The Platform may be unavailable due to scheduled maintenance, emergency repairs, or circumstances beyond our control.

### 12.2 Automatic Diagnostics and Crash Reports

To maintain platform integrity, security, and stability, the Platform automatically monitors performance and records system errors and crashes. By using the Platform, you acknowledge and agree that we may collect and analyze diagnostic reports — which may include browser and system specifications and associated account identifiers — to resolve bugs and optimize the service.

Diagnostic data is processed in accordance with our Privacy Policy. This collection is carried out under our legitimate interest in ensuring the safe, secure, and reliable operation of the Platform.

### 12.3 Feature Availability and Beta Status

Certain features, services, tools, or integrations described on the Platform, in the documentation, or in our marketing materials may be under active development, offered in a "Beta" or "Preview" capacity, or designated as "Coming Soon" (collectively, "Beta Features"). You acknowledge and agree that:

- **No Warranty of Functionality:** Beta Features are provided on an "as-is" and "as-available" basis. We do not warrant that Beta Features will be fully functional, error-free, meet your requirements, or operate without interruption.
- **Right to Modify or Discontinue:** We reserve the right, in our sole discretion, to modify, suspend, restrict access to, or permanently discontinue any Beta Features (or the Platform as a whole), or any portion thereof, at any time, for any reason, and without notice or liability to you.
- **No Guarantee of Release:** The designation of a feature as "Coming Soon" or in "Beta" does not constitute a commitment, representation, or warranty that such feature will ever be finalized, released, or made generally available.

### 12.4 Illustrative Mockups and Visual Representations

Any visual representations, user interface mockups, videos, screen recordings, animations, or descriptive content of features and workflows shown on the marketing site (including abram.network) or within our documentation are for illustrative and demo purposes only. These representations are meant to demonstrate the general conceptual capabilities of the Platform and do not constitute a binding representation, agreement, or warranty of current availability, future availability, or exact design of such features.

---

## 13. Termination

ABRAM may suspend or terminate your account at any time for violation of these Terms. You may delete your account through account settings. Upon termination:

- Your access to the Platform ceases immediately;
- Personal data is deleted in accordance with our Privacy Policy retention timelines; and
- Anonymized financial and transaction records are retained for legal compliance purposes.

---

## 14. Disclaimers & Limitation of Liability

**THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.** To the maximum extent permitted by applicable law, ABRAM disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.

**ABRAM IS NOT LIABLE FOR:**

- Any payments, disputes, or financial losses arising between Clients and Contractors;
- Loss of data, revenue, or business opportunities;
- Errors or inaccuracies in AI-generated outputs;
- Service interruptions or downtime;
- Actions of third-party integration providers.

**ABRAM''s total liability** to you for any claim shall not exceed the greater of (a) the total subscription fees you paid to ABRAM in the twelve (12) months immediately preceding the claim, or (b) USD $500.

Nothing in this Section limits ABRAM''s liability for: (i) fraud or fraudulent misrepresentation; (ii) death or personal injury caused by ABRAM''s negligence; or (iii) any liability that cannot be excluded or limited by applicable law, including statutory obligations under GDPR, CCPA, or equivalent privacy regulations.

---

## 15. Industry-Specific Notices

### 15.1 Union & Guild Compliance

The Platform is used by professionals covered by union or guild agreements (e.g., SAG-AFTRA, IATSE, DGA, WGA, Teamsters). It is your sole responsibility to ensure that engagements made through the Platform comply with applicable union, guild, or collective bargaining agreements. ABRAM does not manage, verify, or guarantee union compliance for any project or engagement.

Without limiting the generality of the foregoing, any feature, setting, label, tag, badge, status, toggle, or visual indicator within the Platform designated or described as "SAG-AFTRA compliant" (or referring to compliance with any other union, guild, or regulatory standard) is provided solely for informational and user-organizational purposes. Such indicators represent a user-configured or system-suggested status flag based on user inputs and generic settings, and do NOT constitute legal verification, certification, or a guarantee of compliance with SAG-AFTRA or other union rules, rates, or agreements. You agree that you will not rely solely on any such indicator, and you assume all liability for verifying actual compliance with applicable guild or union rules. ABRAM shall have no liability whatsoever for any reliance on, or errors, omissions, or inaccuracies in, any such compliance indicators, flags, or features.

### 15.2 Production Permits & Insurance

Clients are responsible for obtaining all required production permits, location agreements, and insurance for any project. ABRAM does not provide, arrange, or verify insurance coverage.

### 15.3 Contractor Classification

Clients are solely responsible for correctly classifying workers under applicable federal, state, and local law, including California AB5, New York''s Freelance Isn''t Free Act, and equivalent statutes. ABRAM''s Platform tools do not constitute a determination of employment status. Clients in California and other jurisdictions with stringent classification requirements are strongly encouraged to obtain qualified legal counsel.

---

## 16. Data Breach Notification

In the event of a personal data breach, ABRAM will notify relevant supervisory authorities within 72 hours of becoming aware of the breach where required by applicable law (including GDPR Article 33). Where a breach is likely to result in high risk to affected individuals, ABRAM will also notify affected users without undue delay. All breaches are documented in an internal breach register.

Report suspected breaches to legal@abram.network.

---

## 17. B2B Data Processing Agreements

If you use ABRAM on behalf of a business and upload personal data of third parties (including employees, crew members, or contractors), ABRAM acts as a data processor and you act as the data controller. Business users may request ABRAM''s standard Data Processing Agreement by contacting legal@abram.network. EU and EEA business users are required to execute a DPA before uploading personal data of third parties.

---

## 18. Governing Law & Dispute Resolution

These Terms are governed by the laws of the District of Columbia, USA, without regard to conflict of law principles. Any disputes shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, with arbitration conducted in Washington, D.C.

Either party may seek injunctive or equitable relief in any court of competent jurisdiction to prevent irreparable harm pending arbitration. Nothing in this Section prevents EU/EEA or UK users from bringing claims before their local courts or supervisory authorities as permitted by applicable law.

---

## 19. Changes to These Terms

ABRAM may update these Terms from time to time. We will notify you of material changes via email or in-app notification at least 30 days before the changes take effect. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.

---

## 20. Contact

**Thomas Abram, LLC**

Email: legal@abram.network  
Address: Washington, DC  
Website: abram.network

---

© 2026 Thomas Abram, LLC. All rights reserved.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'user-guide/README',
        '',
        '',
        '',
        '{}'::text[],
        '# ABRAM Network - User Guide Directory

Welcome to the **ABRAM Network User Guide**. This documentation directory serves as the comprehensive manual for creative producers, agencies, production managers, and specialized freelancers using the ABRAM production management platform. 

This guide is structured around active workflows in the **Management Phase** of the platform, focusing on AI project intake, resource scheduling, team allocation, invoicing, and collaboration.

---

## 🗺️ Documentation Directory

* **[0.0 User & AI Assistant Navigation Guide](./0.0-agent-and-human-navigation-guide.md)**: Introduction to reading these guides as a human user or parsing them as an AI agent/chatbot.
* **[0.1 Glossary & Acronym Reference](./0.1-glossary-and-acronyms.md)**: Quick definitions of industry terms, payment jargon, and technical integration acronyms.
* **[0.2 Order of Operations Guide](./0.2-order-of-operations.mdx)**: Chronological step-by-step workflow tracing a project from intake to final freelancer payouts.
* **[0.3 AI Capabilities & the Abram Assistant](./0.3-ai-capabilities-and-copilot.md)**: Details of ABRAM''s AI features, including Brief Intelligence, crew suggestions, the AI resume importer, Agent Skills, and the Abram assistant.
* **[0.4 ABRAM Memory & Organization Brain](./0.4-production-brain-and-workspace-memory.mdx)**: How the personal ABRAM Memory and the shared Organization Brain store knowledge, plus the admin review workflow that governs shared facts.
 
### 🚪 [Section 1: Getting Started, Organizations & Team Setup](./1.1-signing-in-and-onboarding.md)
Learn how to create your account, configure organization settings, and manage your team roster.
* **[1.1 Signing In and Onboarding](./1.1-signing-in-and-onboarding.md)**: Authenticating, completing the onboarding wizard, and selecting workspace roles.
* **[1.2 Setting Up Your Profile](./1.2-setting-up-your-profile.md)**: Completing bio details, skill lists, rates, and setting profile visibility.
* **[1.3 Organization Setup & Custom Forms](./1.3-organization-setup-and-custom-forms.md)**: Upgrading to an organization, managing workspace settings, and building custom producer intake forms.
* **[1.4 Team Management & Permissions](./1.4-team-management-and-permissions.md)**: Managing team roles (Owner, Admin, Member), custom roles, bulk invites, plan seats, and audit logs.
* **[1.5 Navigating Your Dashboard](./1.5-navigating-your-dashboard.md)**: Customizable dashboard widgets, health and completion metrics, AI suggestions, and the notification center.
* **[1.6 Account & Workspace Settings](./1.6-account-settings.md)**: A tour of the Settings tabs — account, billing, payouts, security and two-factor, privacy, connectors, Agent Skills, and ABRAM Memory.
 
---
 
### 📝 [Section 2: Project Intake & Scoping](./2.1-ai-brief-analyzer.md)
Discover how to initiate and configure projects using AI brief analysis or manual builders.
* **[2.1 AI Brief Analyzer (Brief Intelligence)](./2.1-ai-brief-analyzer.md)**: Initializing projects from text/documents, managing the AI confidence gate, and reviewing extracted parameters.
* **[2.2 Manual Project Creation](./2.2-manual-project-creation.md)**: Using the manual setup wizard, selecting project archetypes, and managing budget splits.
* **[2.3 Custom Intake Forms](./2.3-custom-intake-forms.md)**: Building intake forms in the Clients hub, sharing request links, and reviewing submissions in the Project Requests inbox.
* **[2.4 AI Script Breakdown](./2.4-ai-script-breakdown.md)**: Importing a screenplay to auto-generate scenes, tag production elements, and build the Master Book of Elements.
 
---
 
### 🎛️ [Section 3: Master Project Detail, Work Packages & Work Orders](./3.1-master-project-detail-overview.mdx)
Understand how to manage active projects, deliverables, checklists, and freelancer agreements.
* **[3.1 Master Project Detail Overview](./3.1-master-project-detail-overview.mdx)**: Navigating the central command center, the Compact Header, and URL parameter synchronization.
* **[3.2 Work Packages & Milestones](./3.2-work-packages-and-milestones.mdx)**: Creating work packages, setting scopes, and defining milestone-based payment schedules.
* **[3.3 Work Orders & Agreements](./3.3-work-orders-and-agreements.mdx)**: Generating work orders for freelancers and equipment, configuring rates, and managing invitation holds.
* **[3.4 Task Lists & Tracking](./3.4-task-lists-and-tracking.md)**: Creating checklists, assigning tasks, and tracking automated progress calculations.
* **[3.5 Equipment & Resource Management](./3.5-equipment-and-resource-management.mdx)**: Inventory tracking, kit building, calendar scheduling, locations, barcode tools, and bulk editing.
* **[3.6 Stripboard & Scene Scheduling](./3.6-stripboard-and-scene-scheduling.md)**: Sequencing scenes into shoot days with the stripboard, Day Out of Days, and the Master Book of Elements.
* **[3.7 Call Sheets](./3.7-call-sheets.md)**: Building, previewing, exporting, and distributing call sheets to your crew.
* **[3.8 Deliverables — Review & Approval](./3.8-deliverables-review-and-approval.md)**: Assigning deliverables, submitting versions, and running feedback and approval.
 
---
 
### 📅 [Section 4: Crewing, Matchmaking & Utilization Scheduling](./4.1-internal-talent-search.md)
Learn how to find talent, receive AI recommendations, and schedule freelancer calendars.
* **[4.1 Internal Talent Search](./4.1-internal-talent-search.md)**: Searching and filtering the internal team roster by skill, availability, and rating.
* **[4.2 AI Matchmaking Suggestions](./4.2-ai-matchmaking-suggestions.mdx)**: Utilizing AI suggestions to find freelancers based on role suitability and budget.
* **[4.3 Inviting & Crew RSVP](./4.3-inviting-and-crew-rsvp.mdx)**: Managing direct project invites, sending chatbot invitations, and tracking freelancer RSVPs.
* **[4.4 Managing Your Utilization Calendar](./4.4-managing-your-utilization-calendar.md)**: Freelancer utilization views, managing blockouts, and setting scheduling holds.
* **[4.5 Syncing External Calendars](./4.5-syncing-external-calendars.md)**: Integrating Google Calendar and Microsoft Outlook for real-time availability updates.
* **[4.6 Team Management Dashboard](./4.6-team-management-dashboard.md)**: Workspace utilization overview, scheduling calendar, capacity planning tool, conflict detection panel, team templates, hours roster, and analytics.
* **[4.7 Run of Show](./4.7-run-of-show.md)**: Building a minute-by-minute segment schedule, AI-generating segments, and running Go Live show control.
 
---
 
### 💳 [Section 5: Payments, Billing & Financials](./5.1-freelancer-stripe-setup.md)
Manage your payment methods, producer checkout sessions, billing, and AI credits.
* **[5.1 Freelancer Stripe Express Setup](./5.1-freelancer-stripe-setup.md)**: Step-by-step Stripe Express onboarding, bank setup, and verification troubleshooting.
* **[5.2 Invoicing & Payouts](./5.2-invoicing-and-payouts.mdx)**: Building PDF invoices, submitting invoices for approval, and tracking Stripe checkout payout flows.
* **[5.3 Billing Ledger & AI Credits](./5.3-billing-ledger-and-ai-credits.mdx)**: Monitoring the organization''s credit balance, consuming credits for AI tasks, and ledger transactions.
* **[5.4 Billing & Payments](./5.4-billing-and-payments.md)**: Configuring payment cards, ACH transfers, and managing automated re-authorizations for Stripe holds.
* **[5.5 Timesheets & Time Tracking](./5.5-timesheets-and-time-tracking.md)**: Logging worked hours against a project and approving them before payout.
* **[5.6 Quotes](./5.6-quotes.md)**: Creating, sending, and converting client quotes into invoices.
* **[5.7 Invite & Earn Referral Program](./5.7-referral-program.md)**: Sharing your referral link and earning AI credits when others join.

---

### 🔌 [Section 6: Integrations & Collaboration](./6.1-slack-notifications.md)
Link Slack, Frame.io, and calendar workspaces to automate creative review and notifications, and share a Client Portal with your clients.
* **[6.1 Slack Notifications](./6.1-slack-notifications.md)**: Connecting Slack channels and customizing real-time project notifications.
* **[6.2 Frame.io Workspaces](./6.2-frameio-workspaces.md)**: Connecting Frame.io accounts, auto-provisioning workspaces, and review links.
* **[6.3 Project Collaboration & File Sharing](./6.3-project-collaboration-and-file-sharing.md)**: Native file sharing, version control, and nested feedback comments.
* **[6.4 Client Portal](./6.4-client-portal.md)**: Giving your clients a private space to follow projects, review deliverables, approve quotes, and pay invoices.

---

### ❓ [Section 7: FAQs & Troubleshooting](./7.1-faqs-and-troubleshooting.md)
Find answers to common questions and troubleshoot calendar, Stripe, or AI credit issues.
* **[7.1 FAQs & Troubleshooting](./7.1-faqs-and-troubleshooting.md)**: Step-by-step troubleshooting for calendar sync webhooks, Stripe onboarding status, invoice capture holds, and AI brief analyzer errors.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'content/clients/quickstart',
        'Quickstart for Producers and Clients',
        '',
        'Producer guide to setting up your client profile, scoping projects with the AI brief analyzer, hiring crew, and approving deliverables on ABRAM Network.',
        '{}'::text[],
        '---
title: ''Quickstart for Producers and Clients''
description: ''Producer guide to setting up your client profile, scoping projects with the AI brief analyzer, hiring crew, and approving deliverables on ABRAM Network.''
---

## 🗺️ Client Journey Overview
As a Producer, agency manager, or studio coordinator, your journey on ABRAM starts with setting up your company workspace and scoping your first creative production. 

```
[Sign In & Wizard] ──> [Configure Profile] ──> [Intake & AI Brief Analyzer] ──> [Hiring & Crew RSVPs] ──> [Review & Approval]
```

---

## 1. Setting Up Your Account

### Sign In
1. Visit the platform login page.
2. Enter your email:
   * **Standard Users**: Choose **Sign In with Magic Link** or use **Social Sign-In** (Google or Microsoft).
   * **Enterprise Users**: Choose **Sign In with Enterprise SSO** and enter your corporate domain.
3. If using magic links, click the login link in your inbox.

### The Onboarding Wizard
Upon your first login, the multi-step Onboarding Wizard will guide you:
1. **Workspace Setup**: Choose **Organization** if representing a studio/agency, or **Independent** if you are a solo producer. Check the **Terms of Use** checkbox.
2. **Primary Role**: Choose **Producer** (for hiring and managing crew).
3. **Details & Attachments**: Enter your company name, location (autocomplete will set your timezone), team size, and creative focus (e.g., *Commercials*, *Podcasts*, *Social Media Content*).
4. **Review & Launch**: Verify your information and click **Launch Workspace**.

---

## 2. Setting Up Your Producer Profile

Your profile acts as your business card to freelancers. Make sure it is fully configured to attract top talent:

1. Click **Profile** in the sidebar and select **Profile Settings** (top-right).
2. **Avatar & Banner**: Upload your logo and high-res banner.
3. **Preferred Project Types**: Select tags describing your production focus.
4. **Typical Budget Range**: Declare your average budget range to align expectations with contractors.
5. **Contact Settings**: Configure visibility limits (Public, Connections Only, Org Only, or Private) for your email, phone, and website.
6. Click **Save Changes**.

---

## 3. Posting and Scoping Projects

Producers can initiate projects through two methods: AI-driven Brief Analyzer or Manual Creation templates.

### Method A: Brief Intelligence (AI-driven)
This is the fastest path to turn a creative brief into a structured project budget and scheduling plan:
1. In the sidebar, go to **Projects** and click **Create Project**.
2. Select **Brief Intelligence**.
3. Upload your creative brief document (PDF/Word up to 5MB) or enter a text description (minimum 100 characters).
4. The engine parses the text and automatically extracts:
   * Project metadata (Title, description, dates, location).
   * Work packages and scheduling phases (e.g., Pre-Production, Shoot, Post).
   * Required role slots (e.g., Director of Photography, Colorist).
   * Deliverables (checklists, formats, revision rounds).
   * Equipment specifications.
   * Estimated budget range.

#### The Confidence Gate
* **Confidence >= 70%**: The project goes to **Planning** status, and the matchmaking dashboard is shown.
* **Confidence < 70%**: The system pauses at a **Clarifying Review Gate**. Answer 3–5 targeted questions generated by the AI to clarify timelines, deliverables, or role requirements, then click **Update Analysis**.

### Method B: Manual Project Creation
1. Click **Create Project** and select **Manual Builder**.
2. Select a pre-designed project archetype (e.g., *Filmmaker*, *Marketing*, or *Creative* template).
3. Set the start/end dates, location, and the total overall budget.
4. Define your budget splits manually across work packages.

---

## 4. Hiring and Reviewing Candidates

Once your project is created and role slots are defined, you can recruit your crew:

### Step 1: Open Matchmaking Suggestions
1. Select the project and click the **Find Matches** button in the upper right.
2. The AI Matchmaking Engine ranks internal roster and external marketplace candidates using a **Match Score (0-100)**.
3. Review candidate details, including **Match Reasonings** (e.g., *"Strong software skills, available during date range"*) and **Concerns** (e.g., *"Hourly rate exceeds target budget by 10%"*).

### Step 2: Send Invitations
* **Direct Roster Invites**: Select candidates from the matchmaking grid and click **Invite Selected**.
* **AI Co-pilot Invites**: Type into the sidebar Chatbot: *"Invite a food photographer to my winter shoot."*
  * The Co-pilot creates an **Action Plan** detailing the role, email, proposed rate, and weekly hours hold.
  * Click the green **Approve** button on the Action Plan card. The system will send the email invitation.
  * *Note: You can send up to 10 external invitations per day.*

### Step 3: Monitor RSVPs
Track invitation status under the **Crew Assembly** section of your project dashboard:
* 🟢 **Accepted**: The contractor is confirmed. A calendar capacity hold is automatically registered on their utilization schedule, and Stripe places a 7-day pre-authorization hold on your funding source.
* 🟡 **Pending / Hold**: The invite is active, awaiting candidate action.
* 🔴 **Declined**: The invite is rejected. Click **Find Replacement** to run a quick roster scan and invite an alternative candidate.

---

## 5. Timesheet and Deliverable Approvals

During and after the production:

### Check Off Deliverables
1. Go to the project’s **Deliverables** tab.
2. Browse uploaded files (up to 100MB) or open connected **Frame.io** workspaces to review drafts.
3. Leave feedback comments or click **Mark Approved** to lock the deliverable.

### Verify Logged Hours
1. Open the project dashboard and go to the **Timesheets** tab (or check the Team Management dashboard).
2. Review the hours logged by freelancers against their work packages.
3. Click **Approve Logged Hours**. These approved records are stored on the billing ledger, updating the amount ready to be billed in the freelancer''s invoice.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'content/contractors/quickstart',
        'Quickstart for Freelancers and Contractors',
        '',
        'Freelancer guide to building your ABRAM profile, importing your resume, connecting Stripe payouts, syncing your calendar, and accepting work invites.',
        '{}'::text[],
        '---
title: ''Quickstart for Freelancers and Contractors''
description: ''Freelancer guide to building your ABRAM profile, importing your resume, connecting Stripe payouts, syncing your calendar, and accepting work invites.''
---

## 🗺️ Freelancer Journey Overview
As a creative contractor, specialized operator, or designer on the ABRAM Network, your primary focus is keeping your profile updated, syncing your calendar availability, accepting work invites, and submitting invoices for payouts.

```
[Sign In] ──> [Import Resume & Skills] ──> [Stripe Connect Express] ──> [Calendar Sync] ──> [RSVP & Get Paid]
```

---

## 1. Setting Up Your Account

### Sign In
1. Navigate to the login screen.
2. Enter your email:
   * **Standard Freelancer**: Click **Sign In with Magic Link** or connect via **Social Sign-In** (Google or Microsoft).
   * **Studio/Agency Freelancer**: If joining a studio roster with corporate SSO, choose **Sign In with Enterprise SSO**.
3. Retrieve the Magic Link from your inbox and authenticate.

### Onboarding Wizard
1. **Workspace Setup**: Choose **Independent** if operating as a solo professional, or **Organization** if you run a studio/agency. Check the **Terms of Use** checkbox.
2. **Primary Role**: Choose **Freelancer / Crew** (for tracking availability and getting hired).
3. **Details & Attachments**: Type in your name and location.
   * **AI Resume Importer**: Drag and drop your resume (PDF/DOCX up to 10MB) onto the upload box. The system parses your history, skills, and bio. Review the staging screen, adjust details, and approve the pre-populated values. *(Note: Resume parsing is free during onboarding).*
4. Click **Launch Workspace**.

---

## 2. Managing Skills & Credentials

Producers search the network using specialized skills and rankings. Keeping your Skills Dashboard current maximizes matchmaking matches:

1. Navigate to **Skills** (or `/freelancer/skills`) in the sidebar.
2. **Skills Tab**: Click **Add Skill** to add technical or creative capabilities (e.g., *Premiere Pro*, *Steadicam Operation*). Set your proficiency level from **Novice** to **Master**.
3. **Specializations Tab**: Declare high-level areas of focus (e.g., *Documentary Sound Mixing*).
4. **Proof Points & Rank**: Track your milestone completion points. As you complete projects on ABRAM, you accumulate proof points and progress through ranks:
   * **Silver** $\rightarrow$ **Gold** $\rightarrow$ **Platinum** (Grants the verified **PRO** badge).
5. **On-Site Preferences**: Set your Travel Radius (in miles) and Work Mode (Remote, Hybrid, or On-Site).

---

## 3. Configuring Stripe Express Payouts

To receive payments directly to your bank account or debit card, you must connect to Stripe Connect Express.

1. Go to **Financials** in the sidebar.
2. Look for the **Payout Setup** card and click **Get Started**.
3. You will be redirected securely to the Stripe-hosted onboarding portal.
4. **Onboard Form**:
   * **Solo Freelancers**: Select **Individual / Sole Proprietor** and enter your DOB, SSN/Tax ID, and phone number.
   * **Studios/Agencies**: Select **Company** and provide your legal business name, EIN, and address.
5. **Payout Destination**: Input your routing and bank account details or link a debit card.
6. Verify details and redirect back to ABRAM.

### Stripe Verification Statuses
* 🟢 **Active**: Fully verified. You are ready to receive automatic payouts.
* 🟡 **In Review**: Stripe is checking your identity documents. This takes 24–48 hours.
* 🟣 **Setup Required**: Verification is incomplete or failed. Click **Complete Setup** to upload required documents (e.g. government ID).

---

## 4. Calendar Sync & Utilization

ABRAM avoids booking overlaps by calculating your real-time capacity:

### Syncing External Calendars
1. Go to **Settings** > **App Connectors** > **Calendar Sync**.
2. Click **Connect** on the Google Calendar or Microsoft Outlook cards.
3. Grant permissions to sync your schedule.
4. *Important*: Only events marked as **"Busy"** on your external calendar are imported as blockouts. Events marked as **"Free"** or **"Tentative"** are ignored.

### Capacity Holds
* Once you accept a project invitation, a **Project Work Capacity Hold** is created as an all-day banner at the top of your calendar.
* This holds your hours (e.g., *10 planned hours per week*) without blocking specific times of day, giving you the flexibility to manage your daily schedule.

---

## 5. RSVP and Work Orders

When producers find you for a role slot, you receive an invitation.

### Public RSVP Screen
You will receive an email containing a link to a secure, public page. **No login is required** to RSVP:
* Review project dates, location, proposed rate, and deliverables guidelines.
* Click **Accept**, **Decline**, or **Tentative** (and type in a message for the producer).

### Accepting the Work Order
* Accepting the invitation converts the reservation into a **Work Order**.
* The status shifts to **Scheduled**, locking the equipment and crew roles.
* Confirming the work order triggers a 7-day pre-authorization hold on the producer''s payment method, guaranteeing your project funds are secured before you begin work.

---

## 6. Submitting Timesheets & Invoices

### Log Your Hours
1. Go to your dashboard and select the **Timesheet** tab.
2. Log actual hours worked against your active deliverables.
3. Submit the logs for approval. Once the project manager approves your hours, they are logged into the billing ledger.

### Build Your Invoice
1. Go to **Financials** > **Invoices** and click **Create Invoice**.
2. **Autofill**: Select the active project. The builder automatically imports your approved timesheet hours, contract rates, and unbilled expenses.
3. **Review Fees**: Review the line items. ABRAM displays the subtotal, the flat **5% payment processing fee**, and the total payout.
4. Click **Send Invoice** or approve the **Purchase Order** sent by the producer.
5. Once the payment is authorized and captured via Stripe, the invoice is marked **Paid**.

### Request Payout
1. In the **Payouts** tab, review your **Available Balance**.
2. Click **Request Payout** (minimum $10.00). Stripe Express will transfer the funds directly to your bank account or debit card.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'content/credits-pricing',
        'AI Credits and Subscription Pricing Tiers',
        '',
        'How ABRAM meters AI credits across monthly allowance, trial, and purchased pools, with caching savings, subscription tiers, and plan upgrade paths.',
        '{}'::text[],
        '---
title: ''AI Credits and Subscription Pricing Tiers''
description: ''How ABRAM meters AI credits across monthly allowance, trial, and purchased pools, with caching savings, subscription tiers, and plan upgrade paths.''
---

## 🗺️ The Three-Pool Credit Structure

ABRAM meters and bills all user-initiated AI actions—such as parsing resumes, extracting project skills, matching candidates, or analyzing project briefs. Every organization''s ledger is divided into three distinct credit pools. When credits are deducted, they are drawn in a strict priority order:

```
  [1] Monthly Allowance  ──►  [2] Trial Credits  ──►  [3] Purchased Balance
  (Resets monthly)           (Valid until expiry)     (Never expires)
```

1. **Monthly Allowance**: Included in your subscription tier (e.g., Team, Studio). Drawn first. Resets every month; unused allowance does not roll over.
2. **Trial Credits**: Awarded during onboarding. Drawn second. Only valid if the trial is still active and has not expired.
3. **Purchased Balance**: Top-up credits bought via Stripe. Drawn last. Purchased credits never expire.

---

## 1. Typical Costs

* **Credit Cost Ranges**: Credit deduction is calculated based on the complexity of the operation and amount of data processed:

| Feature / Action | Billing Model | Typical Cost / Range |
| :--- | :--- | :--- |
| **Project Brief Analysis** | Based on brief size & details | 5 - 25 credits per analysis |
| **AI Team Matchmaking Suggestions** | Based on scope size & candidate count | 5 - 20 credits per suggestion |
| **Resume & Profile Importing** | Based on resume file size | 2 - 10 credits per import |
| **Chatbot Co-pilot Interaction** | Per query/response | 0.5 - 5 credits per message |
| **Web Search Tool** | Based on query & results size | 1 - 5 credits per search |
| **Image Generation** | Based on resolution & quality | 5 - 15 credits per image |

---

## 2. Caching & Cost-Saving Optimizations

To protect your budget from duplicate charges, ABRAM includes automated memory safeguards:

* **Smart Query Optimization**: If you ask follow-up questions within the same context (e.g. refining a project brief or candidate list), the platform reads from memory at a fraction of the standard credit cost.
* **Saved Role Estimates**: Once the AI estimates hours for a work package, the results are saved to the project''s deliverables. Rerunning matches reads from this saved memory, costing **0 credits**.
* **Match Reasoning Cache**: The detailed match reasonings and concerns are cached for your session. Opening a candidate''s profile preview does not trigger a new AI billing charge.
* **Disconnect Protection**: If a network disconnect or timeout occurs during an analysis, the platform ensures your ledger is only billed for the portion of the task successfully processed up to the point of interruption.

---

## 3. Subscription Pricing Plans

ABRAM offers plans tailored to solo creators, production teams, and studios:

| Plan | Price | Seats | Active Projects | Included Credits | Storage | Key Features |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | $0/mo | 1 seat | 1 | 80 one-time* | 500 MB | Core scoping, 1 location, up to 3 invoices/mo |
| **Solo Lite** | $19/mo | 1 seat | Up to 3 | 300 / mo | 3 GB | AI matchmaking suggestions, 3 locations, up to 10 external crew per project, up to 10 invoices/mo |
| **Solo Pro** | $34/mo | 1 seat | Unlimited | 600 / mo | 10 GB | Brief parser, calendar sync, PDF exports, 5 client portals, 10 locations, up to 25 external crew per project, full timesheets |
| **Team** | $39/seat/mo | 2 - 5 seats | Unlimited | 500 / seat / mo | 10 GB | Team collaboration, 15 client portals, 3 active custom intake forms, 25 locations, capacity planning dashboard |
| **Studio** | $49/seat/mo | 6 - 20 seats | Unlimited | 1,000 / seat / mo | 15 GB | Barcode scanning, 50 client portals, unlimited active intake forms, unlimited locations |
| **Enterprise** | Custom | Starts at 21 seats + | Unlimited | Custom | Custom | Custom app flavors & builds, SSO/SCIM, unlimited client portals, compliance audit logs, custom roles |

*\*The Free tier includes 80 AI credits as a one-time welcome grant that expires 30 days after signup. It is not a recurring monthly quota.*

*Note: Team and Studio plans require a minimum of 2 and 6 seats respectively.*

### Advanced Scheduling & Budgeting Gating

To provide basic trial access to freelancers and solo creators on lower tiers, advanced scheduling and budgeting features are gated by plan level:

| Tier | Scheduling Access | Budgeting Access |
| :--- | :--- | :--- |
| **Free** | **Read-Only**: Can view the stripboard / calendar, but editing, drag-and-drop, AI Sort, Sync Crew, and adding breaks are locked. | **Trial**: Can create/edit up to **5 budget line items** and **5 expenses**. Editing/adding beyond that is locked. |
| **Solo Lite** | **Read-Only**: Can view the stripboard / calendar, but editing, drag-and-drop, AI Sort, Sync Crew, and adding breaks are locked. | **Trial**: Can create/edit up to **5 budget line items** and **5 expenses**. Editing/adding beyond that is locked. |
| **Solo Pro** | **Full Access**: Drag-and-drop, AI Sort, Sync Crew, and adding breaks are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **Team** | **Full Access**: Drag-and-drop, AI Sort, Sync Crew, and adding breaks are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **Studio** | **Full Access**: Drag-and-drop, AI Sort, Sync Crew, and adding breaks are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. |
| **SMB / Enterprise** | **Full Access**: Drag-and-drop, AI Sort, Sync Crew, and adding breaks are fully unlocked. | **Full Access**: Unlimited budget line items and expenses. Custom AI credits. |

---

## 4. Credit Top-Up Packs

If your organization runs out of its monthly credit allowance, you can buy top-up packs. Top-up credits never expire and are only used after your monthly allowance is depleted:

| Pack Name | Included Credits | Price |
| :--- | :--- | :--- |
| **Basic Pack** | 150 credits | $10 |
| **Pro Pack** | 500 credits | $25 |
| **Maximum Pack** | 1200 credits | $50 |

---

## 5. Organization-Bound Billing & Roster Rules

* **Roster Gating**: All billing ledgers are bound to organizations. Solo users are billed through their personal organization workspace.
* **Onboarding Exemption**: AI calls made during the onboarding wizard (e.g., parsing your initial resume when setting up your profile) are completely free.

---

## 6. Upgrading Plans & Workspace Promotion

Owners and Admins can purchase additional credits or upgrade plan tiers in **Settings** > **Billing**:

### Buying Ad-Hoc Top-Ups
If your balance runs low, you can click **Top-Up** to purchase credit packs. This opens Stripe Checkout to securely process the purchase, updating your balance immediately.

### Upgrading a Personal Workspace
If you are currently on the **Free** tier in a personal workspace and select a team subscription:
1. **Workspace Promotion Flow**: The platform launches a coordinated flow prompting you for your Company Name and Team Size.
2. The platform automatically promotes your personal workspace to a full **Organization**.
3. You are redirected to Stripe Checkout to set up the subscription.
4. Once completed, your organization''s Monthly Allowance is active, and team seat limits are updated.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    

      
INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'content/orgs/quickstart',
        'Quickstart for Organizations and Studios',
        '',
        'Set up your agency or studio workspace on ABRAM, manage team permissions, configure Enterprise SSO and SCIM, and build custom project intake pipelines.',
        '{}'::text[],
        '---
title: ''Quickstart for Organizations and Studios''
description: ''Set up your agency or studio workspace on ABRAM, manage team permissions, configure Enterprise SSO and SCIM, and build custom project intake pipelines.''
---

## 🗺️ Organization Management Overview
Production companies, creative agencies, and studios use ABRAM to manage multiple active projects, maintain a shared freelancer roster, track camera and studio inventory, and centralize financial billing across their team.

```
[Upgrade Workspace] ──> [Team & SCIM Sync] ──> [Operational Buffers] ──> [Intake Builders] ──> [Portfolio & billing]
```

---

## 1. Upgrading to an Organization

If you registered your workspace as **Independent** during your initial onboarding, you can upgrade to a collaborative studio company at any time:

1. Click on **Settings** in the sidebar.
2. Select the **Workspace** tab and choose **Upgrade to Company**.
3. Complete the creation fields:
   * **Organization Name**: Legal studio or agency entity name.
   * **Organization Type**: Select Agency, Studio, Enterprise, or Production Company.
   * **HQ Location & Timezone**: Set your operating city and timezone.
   * **Website & Bio**: Share details about your creative focus.
4. Click **Create Organization**. The interface will update, giving you access to the team, billing, and logistics dashboards.

---

## 2. Team Management & Access Control

Managing team members is handled through the **Team** tab on your organization dashboard.

### Workspace Roles
ABRAM defines three main roles:
* **Owner**: The primary creator. Complete control over settings, subscriptions, custom roles, permissions, and workspace deletion.
* **Admin**: Administrative access. Can invite teammates, modify profiles, configure gear, and edit all projects. Cannot delete the organization.
* **Member**: Standard staff. Access is controlled by custom *Granular Permissions*.

### Granular Permissions
Open the **Edit Team Member** modal to toggle specific access permissions:
* **Team Management**: Invite, edit, or remove teammates.
* **Financial Access**: View project budgets, freelancer contract rates, and invoices.
* **Financial Management**: Create, edit, and capture project invoices.
* **Org Profile Management**: Manage branding assets, banners, and logos.
* **Resource Management**: Edit equipment catalogs, schedule logistics, and log kit details.
* **Internal Project Requests**: Configure request intake forms and approve requests.
* **Project Access Settings**:
  * *Manage All Organization Projects*: User can view and edit all organization-wide projects.
  * *Assigned Projects Only*: User is restricted strictly to projects they are added to.

---

## 3. Enterprise SSO & Directory Sync (SCIM)

Enterprise studios can automate user provisioning and lock access security through SAML/OIDC and SCIM:

1. Navigate to **Organization Settings** > **Enterprise Authentication**.
2. Click **Generate Portal Link** for SSO or Directory Sync. (This opens a secure setup portal powered by WorkOS).
3. Connect your Identity Provider (Okta, Microsoft Entra ID, Google Workspace, Azure AD, etc.).
4. **SCIM Directory Sync Rules**:
   * Once SCIM is enabled, all member accounts, active statuses, and roles are driven by your corporate directory.
   * **Local Read-Only Lock**: The local ABRAM member directory becomes read-only. Modifying names, roles, or deleting members must be done inside your corporate identity provider. Changes sync to ABRAM within seconds.

---

## 4. Configuring Logistics & Operations

Track equipment and minimize booking errors by configuring operational settings in the **Logistics** settings panel:

* **Transit Buffer Days**: Specify buffer days (e.g., *1 or 2 days*) automatically added before and after bookings. This reserves the gear during transit, prep, and return inspect cycles.
* **Transit Method**: Select default transport methods (Pickup, Shipping, Courier, or Dropoff).
* **Enforce Return Inspections**: Toggle whether physical items must undergo QA checks before being marked as available for the next production.
* **Needs Repair Lockout**: Damaged gear marked as "Needs Repair" is locked from calendar reservations.

---

## 5. Custom Request Intake Pipelines

Build a client or department intake portal to collect briefs and project details.

### Building the Form
1. Go to settings and select **Intake Form Builder**.
2. **Standard Fields**: Select which baseline fields (Budget, Dates, Project Description, File Upload) are shown and marked as required.
3. **Custom Fields**: Click **Add Custom Field** to create specific text, number, paragraph, or dropdown questions.
4. **Domain Gating**: Enter allowed domains (e.g., `agencypartner.com`) to restrict submissions and prevent spam.

### Field Mappings
Link custom answers to project requirements to let the AI engine map resources automatically:
* **Required Skills**: Map dropdown answers to auto-populate roles (e.g., matching "Need visual effects" to a *VFX Compositor* role slot).
* **Required Gear**: Map questions to add camera packages or kits to the project requirements.
* **Software**: Map answers to assign software tools (e.g., *Premiere Pro* or *DaVinci Resolve*).

### The Intake Inbox
* All submitted forms land in your **Project Request Inbox**.
* Review the uploaded brief, timeline details, and answers.
* Click **Approve & Convert**:
  1. Creates a project in **Planning** status.
  2. Prompts you to select a Project Owner.
  3. Moves brief attachments to the project documents folder, where they are indexed by the **Brief Analyzer**.
  4. Mapped skills and equipment are auto-loaded to trigger the AI Matchmaking Engine.
  5. The client requester is automatically notified via email.
'
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    