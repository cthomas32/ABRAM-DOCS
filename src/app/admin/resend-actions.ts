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

      const { error: upsertError } = await supabase
        .from("subscribers")
        .upsert({
          email,
          first_name: contact.firstName || contact.first_name || null,
          last_name: contact.lastName || contact.last_name || null,
          resend_contact_id: contact.id,
          status: contact.unsubscribed ? "unsubscribed" : "subscribed",
          is_marketing_list: true,
          is_application_list: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });

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

      const { error: upsertError } = await supabase
        .from("subscribers")
        .upsert({
          email,
          first_name: contact.firstName || contact.first_name || null,
          last_name: contact.lastName || contact.last_name || null,
          resend_contact_id: contact.id,
          status: contact.unsubscribed ? "unsubscribed" : "subscribed",
          is_marketing_list: true,
          is_application_list: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });

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
  isMarketingList?: boolean,
  isApplicationList?: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await addSubscriber({
      email,
      firstName,
      lastName,
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
      
      // Inline newsletter style for Blog
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${post.title}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
              <tr>
                <td align="center" style="padding: 40px 10px;">
                  <!-- Simulated Glass Card -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
                    <!-- Floating Logo Header (Unified spacing, no harsh border line) -->
                    <tr>
                      <td align="center" style="padding: 44px 32px 16px;">
                        <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
                      </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                      <td style="padding: 16px 32px 32px;">
                        <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          ${post.title}
                        </h1>
                        <p style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          ${post.summary || "Read the latest update from the ABRAM team."}
                        </p>
                        <!-- Button Link with inline border-collapse fix and compact button size -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border-collapse: separate !important;">
                          <tr>
                            <td bgcolor="#FAFAF9" style="border-radius: 9999px; border-collapse: separate !important;">
                              <a href="https://abram.network/blog/${post.slug}" target="_blank" style="display: inline-block; padding: 10px 24px; font-size: 12px; font-weight: 600; color: #0A0A0A; text-decoration: none; text-align: center; letter-spacing: 0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                                Read Full Article
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size: 11px; color: #71717A; border-top: 1px solid #27272A; padding-top: 24px; margin-top: 24px; line-height: 1.6; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          You are receiving this because you subscribed to updates from ABRAM. <br />
                          Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
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
      
      // Inline newsletter style for Releases
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>v${note.version} - ${note.title}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0A" style="table-layout: fixed;">
              <tr>
                <td align="center" style="padding: 40px 10px;">
                  <!-- Simulated Glass Card -->
                  <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0F0F12" style="width: 600px; border-radius: 16px; border: 1px solid #27272A; border-top: 1px solid #3F3F46; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
                    <!-- Floating Logo Header (Unified spacing, no harsh border line) -->
                    <tr>
                      <td align="center" style="padding: 44px 32px 16px;">
                        <img src="https://abram.network/abram-logo-lockup-cream.png" alt="ABRAM" width="110" height="22" style="border: 0; display: block; outline: none; text-decoration: none;" />
                      </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                      <td style="padding: 16px 32px 32px;">
                        <!-- Version Badge with inline border-collapse separate fix -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px; border-collapse: separate !important;">
                          <tr>
                            <td align="center" style="border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.04); border-collapse: separate !important; vertical-align: middle;">
                              <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8ECAFF; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1;">
                                Version ${note.version}
                              </span>
                            </td>
                          </tr>
                        </table>
                        <h1 style="font-size: 24px; font-weight: 600; color: #FAFAF9; margin-top: 0; margin-bottom: 16px; line-height: 1.35; letter-spacing: -0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          ${note.title}
                        </h1>
                        <div style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          ${note.content}
                        </div>
                        <!-- Button Link with inline border-collapse fix and compact button size -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border-collapse: separate !important;">
                          <tr>
                            <td bgcolor="#FAFAF9" style="border-radius: 9999px; border-collapse: separate !important;">
                              <a href="https://abram.network/changelog" target="_blank" style="display: inline-block; padding: 10px 24px; font-size: 12px; font-weight: 600; color: #0A0A0A; text-decoration: none; text-align: center; letter-spacing: 0.02em; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                                View Changelog
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size: 11px; color: #71717A; border-top: 1px solid #27272A; padding-top: 24px; margin-top: 24px; line-height: 1.6; font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
                          You are receiving this because you subscribed to updates from ABRAM. <br />
                          Thomas Abram, Inc. &bull; Washington, DC &bull; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #3B82F6; text-decoration: underline;">Unsubscribe</a> from this list.
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
  segmentId?: string
) {
  try {
    const result = await createDraftCampaign({
      title,
      subject,
      textContent,
      htmlContent,
      segmentId,
    });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to create manual campaign draft." };
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
