"use server";

import { createClient } from "@/utils/supabase/server";
import { addSubscriber, createDraftCampaign, approveAndSendCampaign, getResendClient } from "@/utils/resend";
import { headers } from "next/headers";

/**
 * Server Action: Validates Resend client integration status.
 */
export async function checkResendIntegrationStatus() {
  const client = getResendClient();
  if (!client) {
    return { success: false, status: "Disconnected", message: "API key is missing." };
  }
  try {
    const response = await client.domains.list();
    const responseData = response.data;
    let domainsCount = 0;
    if (responseData) {
      if (Array.isArray(responseData)) {
        domainsCount = responseData.length;
      } else if (
        typeof responseData === "object" &&
        "data" in responseData &&
        Array.isArray((responseData as { data: unknown }).data)
      ) {
        domainsCount = (responseData as { data: unknown[] }).data.length;
      }
    }
    return {
      success: true,
      status: "Connected",
      message: `Successfully authenticated. Registered domains: ${domainsCount}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, status: "Error", message };
  }
}

/**
 * Server Action: Fetches all subscriber contacts tracked in our database.
 */
export async function getSubscribers(): Promise<{ success: boolean; subscribers?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, subscribers: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to fetch subscribers." };
  }
}

/**
 * Helper to fetch contacts for a specific segment directly via Resend REST API
 */
async function fetchContactsForSegment(apiKey: string, segmentId: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.resend.com/segments/${segmentId}/contacts`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "abram-next/1.0",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(`Resend API returned status ${res.status} for segment ${segmentId}:`, errorData);
      return [];
    }

    const payload = await res.json();
    return Array.isArray(payload) ? payload : (payload.data || []);
  } catch (err) {
    console.error(`Network error fetching segment ${segmentId}:`, err);
    return [];
  }
}

/**
 * Server Action: Synchronizes all contacts from Resend into the local Supabase database.
 */
export async function syncResendContacts(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const apiKey = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Resend API key is not configured.");
    }

    const supabase = await createClient();

    // Check if job_title and company_size columns exist in the database (self-healing DDL safety)
    const { error: colCheckError } = await supabase
      .from("subscribers")
      .select("job_title, company_size")
      .limit(1);
    const hasMarketingFields = !colCheckError;

    const marketingSegmentId = process.env.RESEND_MARKETING_SEGMENT_ID || "8324468f-0399-4c05-9b98-3e17e76ffa41";
    const applicationSegmentId = process.env.RESEND_APPLICATION_SEGMENT_ID || "42a3da82-ad27-475f-b2ad-113c9c8fa6b8";

    // 1. Fetch contacts from both segments asynchronously
    const [marketingContacts, applicationContacts] = await Promise.all([
      fetchContactsForSegment(apiKey, marketingSegmentId),
      fetchContactsForSegment(apiKey, applicationSegmentId)
    ]);

    console.log(`Fetched Resend contacts: Marketing: ${marketingContacts.length}, Application: ${applicationContacts.length}`);

    // Map to keep track of processed emails to avoid duplicate upsert operations in this loop
    const syncedEmails = new Set<string>();
    let syncCount = 0;

    // 2. Sync Application Contacts (Application = true, Marketing = true)
    for (const contact of applicationContacts) {
      const email = contact.email?.trim().toLowerCase();
      if (!email || syncedEmails.has(email)) continue;

      const resendProps = contact.properties || contact.custom_properties || {};
      const jobTitleVal = resendProps.jobTitle || null;
      const companySizeVal = resendProps.companySize || null;

      const upsertData: any = {
        email,
        first_name: contact.firstName || contact.first_name || null,
        last_name: contact.lastName || contact.last_name || null,
        resend_contact_id: contact.id,
        status: contact.unsubscribed ? "unsubscribed" : "subscribed",
        is_marketing_list: true,
        is_application_list: true,
        updated_at: new Date().toISOString(),
      };

      if (hasMarketingFields) {
        upsertData.job_title = jobTitleVal;
        upsertData.company_size = companySizeVal;
      }

      const { error: upsertError } = await supabase
        .from("subscribers")
        .upsert(upsertData, { onConflict: "email" });

      if (upsertError) {
        console.error(`Failed to sync application contact ${email}:`, upsertError.message);
      } else {
        syncedEmails.add(email);
        syncCount++;
      }
    }

    // 3. Sync Marketing Contacts (Marketing = true, Application = false unless already synced as App)
    for (const contact of marketingContacts) {
      const email = contact.email?.trim().toLowerCase();
      if (!email || syncedEmails.has(email)) continue;

      const resendProps = contact.properties || contact.custom_properties || {};
      const jobTitleVal = resendProps.jobTitle || null;
      const companySizeVal = resendProps.companySize || null;

      const upsertData: any = {
        email,
        first_name: contact.firstName || contact.first_name || null,
        last_name: contact.lastName || contact.last_name || null,
        resend_contact_id: contact.id,
        status: contact.unsubscribed ? "unsubscribed" : "subscribed",
        is_marketing_list: true,
        is_application_list: false,
        updated_at: new Date().toISOString(),
      };

      if (hasMarketingFields) {
        upsertData.job_title = jobTitleVal;
        upsertData.company_size = companySizeVal;
      }

      const { error: upsertError } = await supabase
        .from("subscribers")
        .upsert(upsertData, { onConflict: "email" });

      if (upsertError) {
        console.error(`Failed to sync marketing contact ${email}:`, upsertError.message);
      } else {
        syncedEmails.add(email);
        syncCount++;
      }
    }

    return { success: true, count: syncCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Sync Resend contacts error:", err);
    return { success: false, error: message || "Failed to synchronize contacts." };
  }
}

/**
 * Server Action: Manually adds a subscriber from the CMS dashboard.
 */
export async function manualAddSubscriber(
  email: string,
  firstName?: string,
  lastName?: string,
  jobTitle?: string,
  companySize?: string,
  isMarketingList?: boolean,
  isApplicationList?: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await addSubscriber({
      email,
      firstName,
      lastName,
      jobTitle,
      companySize,
      isMarketingList,
      isApplicationList,
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to register subscriber." };
  }
}

/**
 * Server Action: Broadcasts a published Blog Post or Release Note to the General subscriber list.
 */
export async function broadcastPublishedEntry(entryId: string, type: "blog" | "changelog"): Promise<{ success: boolean; broadcastId?: string; campaignId?: string; message?: string; error?: string }> {
  try {
    const supabase = await createClient();

    let subject = "";
    let title = "";
    let htmlContent = "";
    let textContent = "";

    // Fetch DB template 'standard'
    let dbTemplateHtml = "";
    let designTokens: any = null;
    try {
      const { data: templateData, error: templateError } = await supabase
        .from("email_templates")
        .select("html_template, design_tokens")
        .eq("name", "standard")
        .single();
      if (!templateError && templateData) {
        dbTemplateHtml = templateData.html_template;
        designTokens = templateData.design_tokens;
      }
    } catch (err) {
      console.warn("Could not load email template standard from Supabase, using hardcoded fallback layout:", err);
    }

    if (type === "blog") {
      const { data: post, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", entryId)
        .single();

      if (error || !post) throw new Error("Blog post not found.");
      if (post.status !== "published") throw new Error("Only published posts can be broadcasted.");

      title = `Blog Broadcast: ${post.title}`;
      subject = `New Article: ${post.title}`;
      const textContentRaw = post.summary || "Read the latest update from the ABRAM team.";

      if (dbTemplateHtml) {
        const ctaBg = designTokens?.cta_bg || "#FAFAF9";
        const ctaColor = designTokens?.cta_color || "#0A0A0A";
        htmlContent = compileTemplateString(dbTemplateHtml, {
          subject,
          preheader: textContentRaw.substring(0, 130).replace(/\n/g, " ") + "...",
          badge: "ARTICLE",
          headline: post.title,
          bodyHtml: `<p style="margin-top: 0; margin-bottom: 16px; line-height: 1.6; color: #A1A1AA; font-size: 15px;">${textContentRaw}</p>`,
          ctaText: "Read Full Article",
          ctaUrl: `https://abram.network/blog/${post.slug}`,
          ctaBg,
          ctaColor,
          ctaClass: designTokens?.cta_bg ? "btn-custom" : "btn-primary"
        });
      } else {
        // Fallback to original hardcoded layout
        htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${post.title}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
                <tr>
                  <td align="center" style="padding:48px 24px;">
                    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
                      <!-- Logo -->
                      <tr>
                        <td align="center" style="padding:0 0 40px;">
                          <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="130" style="display:block;height:auto;border:0;" />
                        </td>
                      </tr>
                      <!-- Headline -->
                      <tr>
                        <td align="center" style="padding:0 0 16px;">
                          <h1 style="margin:0;font-size:28px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
                            ${post.title}
                          </h1>
                        </td>
                      </tr>
                      <!-- Body -->
                      <tr>
                        <td style="padding:0 0 32px;">
                          <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#888888; text-align:left;">
                            ${post.summary || "Read the latest update from the ABRAM team."}
                          </p>
                        </td>
                      </tr>
                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding:0 0 32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background-color:#ffffff;border-radius:9999px;">
                                <a href="https://abram.network/blog/${post.slug}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.2px;">
                                  Read Full Article
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
          </html>
        `;
      }
      textContent = `New Blog Post Published: ${post.title}\n\nSummary: ${post.summary}\n\nRead the full article at: https://abram.network/blog/${post.slug}\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`;
    } else {
      const { data: note, error } = await supabase
        .from("release_notes")
        .select("id, version, title, content, status")
        .eq("id", entryId)
        .single();
      
      if (error || !note) throw new Error("Release note not found.");
      if (note.status !== "published") throw new Error("Only published release notes can be broadcasted.");

      title = `Release Broadcast v${note.version}`;
      subject = `Release Notes: v${note.version} - ${note.title}`;
      const textContentRaw = `New Release v${note.version} Published: ${note.title}`;

      if (dbTemplateHtml) {
        const ctaBg = designTokens?.cta_bg || "#FAFAF9";
        const ctaColor = designTokens?.cta_color || "#0A0A0A";
        htmlContent = compileTemplateString(dbTemplateHtml, {
          subject,
          preheader: textContentRaw.substring(0, 130).replace(/\n/g, " ") + "...",
          badge: `VERSION ${note.version}`,
          headline: note.title,
          bodyHtml: `<div style="font-size: 15px; line-height: 1.6; color: #A1A1AA; text-align: left;">${note.content}</div>`,
          ctaText: "View Changelog",
          ctaUrl: "https://abram.network/changelog",
          ctaBg,
          ctaColor,
          ctaClass: designTokens?.cta_bg ? "btn-custom" : "btn-primary"
        });
      } else {
        // Fallback to original hardcoded layout
        htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>v${note.version} - ${note.title}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
                <tr>
                  <td align="center" style="padding:48px 24px;">
                    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
                      <!-- Logo -->
                      <tr>
                        <td align="center" style="padding:0 0 40px;">
                          <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="130" style="display:block;height:auto;border:0;" />
                        </td>
                      </tr>
                      <!-- Version Badge -->
                      <tr>
                        <td align="center" style="padding:0 0 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border:1px solid rgba(255,255,255,0.15);border-radius:9999px;padding:4px 12px;background-color:rgba(255,255,255,0.04);vertical-align:middle;text-align:center;line-height:12px;">
                                <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8ECAFF;line-height:12px;display:inline-block;vertical-align:middle;">
                                  Version ${note.version}
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
                            ${note.title}
                          </h1>
                        </td>
                      </tr>
                      <!-- Body -->
                      <tr>
                        <td style="padding:0 0 32px;">
                          <div style="font-size:15px;line-height:1.6;color:#888888;text-align:left;">
                            ${note.content}
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
                                  View Changelog
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
          </html>
        `;
      }
      textContent = `New Release v${note.version} Published: ${note.title}\n\nRead the release notes at: https://abram.network/changelog\n\nUnsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`;
    }

    const result = await createDraftCampaign({
      title,
      subject,
      htmlContent,
      textContent,
    });

    return {
      success: true,
      campaignId: result.campaignId,
      message: "Campaign queued as Draft. Manual approval is required."
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to create campaign draft." };
  }
}

/**
 * Server Action: Fetches all campaigns tracked in the database.
 */
export async function getCampaigns(): Promise<{ success: boolean; campaigns?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, campaigns: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to fetch campaigns." };
  }
}

/**
 * Server Action: Manually creates a campaign draft from raw input.
 */
export async function createManualDraftCampaign(
  title: string,
  subject: string,
  textContent: string,
  htmlContent: string,
  segmentId?: string,
  metadata?: any,
  recipientsCount?: number,
  recipientEmails?: string[]
) {
  try {
    const result = await createDraftCampaign({
      title,
      subject,
      textContent,
      htmlContent,
      segmentId,
      metadata,
      recipientsCount,
      recipientEmails,
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to create manual campaign draft." };
  }
}

/**
 * Server Action: Updates an existing campaign draft in the database.
 */
export async function updateManualDraftCampaignAction(
  campaignId: string,
  title: string,
  subject: string,
  textContent: string,
  htmlContent: string,
  segmentId?: string,
  metadata?: any,
  recipientsCount?: number
) {
  try {
    const supabase = await createClient();

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized. Admin privileges are required to update campaign drafts.");
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        title,
        subject,
        text_content: textContent,
        html_content: htmlContent,
        segment_id: segmentId || null,
        metadata: metadata || null,
        recipients_count: recipientsCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("status", "draft")
      .select()
      .single();

    if (error) throw error;
    return { success: true, campaign: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to update campaign draft." };
  }
}

/**
 * Server Action: Securely approves and sends a draft campaign.
 * Captures user identity, IP address, and browser agent string for the database log.
 */
export async function approveAndSendCampaignAction(campaignId: string, confirmationPhrase: string) {
  try {
    const supabase = await createClient();

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized. Admin privileges are required to send campaigns.");
    }

    // Capture request audit details
    const reqHeaders = await headers();
    const ipAddress = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown-ip";
    const userAgent = reqHeaders.get("user-agent") || "unknown-user-agent";

    const result = await approveAndSendCampaign(campaignId, {
      approvedBy: user.id,
      ipAddress,
      userAgent,
      confirmationPhrase,
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to approve and send campaign." };
  }
}


/**
 * Server Action: Fetches all logs for a specific campaign or all campaigns.
 */
export async function getCampaignLogs(campaignId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("campaign_logs")
      .select("*")
      .order("sent_at", { ascending: false });

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, logs: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to fetch campaign logs." };
  }
}

/**
 * Server Action: Fetches all email templates from Supabase.
 */
export async function getEmailTemplates(): Promise<{ success: boolean; templates?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return { success: true, templates: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to fetch email templates." };
  }
}

/**
 * Server Action: Sends a one-off test email to a single address so the admin
 * can verify layout and content before dispatching to everyone.
 * Uses the same from-address as production broadcasts.
 * No campaign record is created — fire-and-forget preview only.
 */
export async function sendTestEmailAction(
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: "Resend integration is not configured on the server." };
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || "ABRAM <updates@abram.network>";
    const testSubject = `[TEST] ${subject}`;

    const response = await resend.emails.send({
      from: fromAddress,
      to: toEmail.trim().toLowerCase(),
      subject: testSubject,
      html: htmlContent,
      text: textContent || "Please view the HTML version of this test email.",
      tags: [{ name: "type", value: "admin_test_preview" }],
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    return {
      success: true,
      message: `Test email delivered to ${toEmail}. Check your inbox — subject will appear as "${testSubject}".`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to send test email." };
  }
}

/**
 * Helper: Compiles template HTML by replacing standard placeholders
 */
function compileTemplateString(
  templateHtml: string,
  data: {
    subject: string;
    preheader: string;
    badge?: string;
    headline: string;
    bodyHtml: string;
    ctaText?: string;
    ctaUrl?: string;
    ctaBg?: string;
    ctaColor?: string;
    ctaClass?: string;
  }
): string {
  // Compile Badge section with inline border-collapse fix
  const badgeSection = data.badge
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px; border-collapse: separate !important;">
        <tr>
          <td align="center" style="border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.04); border-collapse: separate !important; vertical-align: middle;">
            <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8ECAFF; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1;">
              ${data.badge}
            </span>
          </td>
        </tr>
      </table>`
    : "";

  // Compile CTA section with inline border-collapse fix and button styles
  const ctaBg = data.ctaBg || "#FAFAF9";
  const ctaColor = data.ctaColor || "#0A0A0A";
  const ctaClass = data.ctaClass || "btn-primary";
  const ctaSection = data.ctaUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px; border-collapse: separate !important;">
        <tr>
          <td bgcolor="${ctaBg}" class="${ctaClass}" style="border-radius: 9999px; overflow: hidden; border-collapse: separate !important;">
            <a href="${data.ctaUrl}" target="_blank" style="display: block; padding: 10px 24px; font-size: 12px; font-weight: 600; color: ${ctaColor}; text-decoration: none; text-align: center; letter-spacing: 0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
              ${data.ctaText || "Read More"}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  let html = templateHtml;
  html = html.replace(/\{\{EMAIL_SUBJECT\}\}/g, data.subject || "");
  html = html.replace(/\{\{PREHEADER_TEXT\}\}/g, data.preheader || "");
  html = html.replace(/\{\{BADGE_SECTION\}\}/g, badgeSection);
  html = html.replace(/\{\{HEADLINE\}\}/g, data.headline || "");
  html = html.replace(/\{\{\{BODY_CONTENT\}\}\}/g, data.bodyHtml || "");
  html = html.replace(/\{\{CTA_SECTION\}\}/g, ctaSection);
  html = html.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, "{{{RESEND_UNSUBSCRIBE_URL}}}"); // Retain placeholder

  return html;
}

