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
          <body style="margin: 0; padding: 0; background-color: #0e0e0e; font-family: Arial, sans-serif; color: #d4d4d8;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0e0e0e">
              <tr>
                <td align="center" style="padding: 40px 10px;">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="border-radius: 12px; border: 1px solid #27272a; overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                      <td align="center" style="padding: 30px 20px 20px; border-bottom: 1px solid #27272a;">
                        <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px;">ABRAM</span>
                      </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
                          ${post.title}
                        </h1>
                        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                          ${post.summary || "Read the latest update from the ABRAM team."}
                        </p>
                        <!-- Button Link -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                          <tr>
                            <td bgcolor="#ef4444" style="border-radius: 9999px;">
                              <a href="https://abram.network/blog/${post.slug}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">
                                Read Full Article
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 20px; line-height: 1.5;">
                          You are receiving this because you subscribed to updates from ABRAM. <br />
                          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #ef4444; text-decoration: underline;">Unsubscribe</a> from this list.
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
        .select("*")
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
          <body style="margin: 0; padding: 0; background-color: #0e0e0e; font-family: Arial, sans-serif; color: #d4d4d8;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0e0e0e">
              <tr>
                <td align="center" style="padding: 40px 10px;">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="border-radius: 12px; border: 1px solid #27272a; overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                      <td align="center" style="padding: 30px 20px 20px; border-bottom: 1px solid #27272a;">
                        <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px;">ABRAM</span>
                      </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ef4444; border: 1px solid #ef4444; border-radius: 9999px; margin-bottom: 16px;">
                          Version ${note.version}
                        </div>
                        <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
                          ${note.title}
                        </h1>
                        <div style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                          ${note.content}
                        </div>
                        <!-- Button Link -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                          <tr>
                            <td bgcolor="#ef4444" style="border-radius: 9999px;">
                              <a href="https://abram.network/changelog" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none;">
                                View Changelog
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 20px; line-height: 1.5;">
                          You are receiving this because you subscribed to updates from ABRAM. <br />
                          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #ef4444; text-decoration: underline;">Unsubscribe</a> from this list.
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
