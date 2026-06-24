import { Resend } from "resend";
import { createClient } from "./supabase/server";

/**
 * Retrieves the Resend client instance safely.
 * If the API key is not configured, it returns null and logs a warning,
 * preventing server-side or build-time crashes when environment variables are missing.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "Resend API integration is disabled: RESEND_MARKETING_API_KEY or RESEND_API_KEY is not defined in environment variables."
    );
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Validates if the Resend API key is configured.
 * Useful for checking connectivity from admin dashboards.
 */
export async function verifyResendIntegration(): Promise<{
  success: boolean;
  message: string;
}> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      message: "RESEND_API_KEY is missing. Check your environment variables.",
    };
  }
  try {
    // Attempt a light list of domains to test connection
    await client.domains.list();
    return { success: true, message: "Resend integration is active." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to connect to Resend: ${message}`,
    };
  }
}

interface SubscribeInput {
  email: string;
  firstName?: string;
  lastName?: string;
  isMarketingList?: boolean;
  isApplicationList?: boolean;
}

/**
 * Subscribes a user to the mailing list (persists to Supabase database).
 * The database trigger/webhook will asynchronously sync the contact to Resend via Edge Functions.
 */
export async function addSubscriber(input: SubscribeInput) {
  const supabase = await createClient();

  // 1. Resolve logical lists (ensure App signup forces Marketing list)
  const isApp = input.isApplicationList || false;
  const isMarketing = isApp ? true : (input.isMarketingList !== undefined ? input.isMarketingList : true);

  // 2. Check if the contact already exists locally
  const { data: existingSub, error: dbError } = await supabase
    .from("subscribers")
    .select("*")
    .eq("email", input.email)
    .maybeSingle();

  if (dbError) {
    console.error("Local database subscriber check failed:", dbError.message);
  }

  if (existingSub && existingSub.status === "subscribed" && existingSub.is_marketing_list === isMarketing && existingSub.is_application_list === isApp) {
    return { success: true, message: "You are already subscribed!" };
  }

  // 3. Persist subscriber to local database table
  const subscriberData = {
    email: input.email.trim().toLowerCase(),
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    status: "subscribed",
    is_marketing_list: isMarketing,
    is_application_list: isApp,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("subscribers")
    .upsert(subscriberData, { onConflict: "email" });

  if (upsertError) {
    console.error("Supabase subscriber upsert error:", upsertError.message);
    throw new Error(`Database Error: ${upsertError.message}`);
  }

  return { success: true, message: "Successfully subscribed!" };
}

interface CreateDraftCampaignInput {
  title: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  segmentId?: string; // Optional segment ID (falls back to General/Marketing segment)
}

interface ApprovalDetails {
  approvedBy: string;
  ipAddress: string;
  userAgent: string;
  confirmationPhrase: string;
}

/**
 * Creates and logs a Campaign Draft in the local database.
 * NEVER connects to Resend or dispatches any emails.
 */
export async function createDraftCampaign(input: CreateDraftCampaignInput) {
  const supabase = await createClient();
  const segmentId = input.segmentId || process.env.RESEND_MARKETING_SEGMENT_ID || "8324468f-0399-4c05-9b98-3e17e76ffa41";

  // Get recipient count estimate from database
  let recipientsCount = 0;
  if (segmentId === (process.env.RESEND_APPLICATION_SEGMENT_ID || "42a3da82-ad27-475f-b2ad-113c9c8fa6b8")) {
    const { count } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_application_list", true)
      .eq("status", "subscribed");
    recipientsCount = count || 0;
  } else {
    const { count } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_marketing_list", true)
      .eq("status", "subscribed");
    recipientsCount = count || 0;
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      title: input.title,
      subject: input.subject,
      segment_id: segmentId,
      status: "draft",
      html_content: input.htmlContent,
      text_content: input.textContent,
      recipients_count: recipientsCount,
    })
    .select()
    .single();

  if (campaignError) {
    console.error("Failed to save campaign draft in database:", campaignError.message);
    throw new Error(`Database Error: ${campaignError.message}`);
  }

  return {
    success: true,
    campaignId: campaign.id,
    message: "Campaign draft created successfully. Manual review and approval are required to send.",
  };
}

/**
 * Executes a manual approval and dispatches the email campaign via Resend.
 * Enforces strict "draft" status validation, optimistic locking, and logs audit data.
 */
export async function approveAndSendCampaign(campaignId: string, approval: ApprovalDetails) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Resend integration is not configured on the server.");
  }

  const supabase = await createClient();

  // 1. Fetch draft campaign
  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) {
    throw new Error("Campaign not found.");
  }

  // 2. Validate status: Must be in "draft"
  if (campaign.status !== "draft") {
    throw new Error(`Campaign cannot be sent because it is in '${campaign.status}' status.`);
  }

  // 3. Optimistic locking: update status to "sending" to prevent double-sends
  const { data: lockedCampaign, error: lockError } = await supabase
    .from("campaigns")
    .update({ status: "sending" })
    .eq("id", campaignId)
    .eq("status", "draft")
    .select()
    .single();

  if (lockError || !lockedCampaign) {
    throw new Error("Failed to acquire send lock. Campaign may already be dispatching.");
  }

  try {
    // 4. Create the Broadcast in Resend
    const broadcastResponse = await resend.broadcasts.create({
      name: campaign.title,
      from: process.env.RESEND_FROM_EMAIL || "ABRAM Team <team@abram.network>",
      subject: campaign.subject,
      text: campaign.text_content || "",
      html: campaign.html_content || "",
      segmentId: campaign.segment_id,
    });

    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.error.message);
    }

    const resendBroadcastId = broadcastResponse.data?.id;
    if (!resendBroadcastId) {
      throw new Error("Resend API failed to return a valid Broadcast ID.");
    }

    // 5. Send the Broadcast immediately
    const sendResponse = await resend.broadcasts.send(resendBroadcastId);

    if (sendResponse.error) {
      throw new Error(sendResponse.error.message);
    }

    // 6. Complete campaign log and approval audit details
    await supabase
      .from("campaigns")
      .update({
        resend_broadcast_id: resendBroadcastId,
        status: "sent",
        sent_at: new Date().toISOString(),
        approved_by: approval.approvedBy,
        approved_at: new Date().toISOString(),
        approval_ip: approval.ipAddress,
        approval_user_agent: approval.userAgent,
        approval_metadata: {
          confirmation_phrase: approval.confirmationPhrase,
          dispatch_mechanism: "manual_approval_dashboard",
        },
      })
      .eq("id", campaignId);

    return {
      success: true,
      broadcastId: resendBroadcastId,
      message: "Campaign approved and successfully dispatched.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Broadcast transmission error:", error);

    // Rollback to failed and store error details
    await supabase
      .from("campaigns")
      .update({
        status: "failed",
        metadata: {
          error: message,
          approval_attempt: {
            approved_by: approval.approvedBy,
            approved_at: new Date().toISOString(),
            approval_ip: approval.ipAddress,
            approval_user_agent: approval.userAgent,
          },
        },
      })
      .eq("id", campaignId);

    return {
      success: false,
      message: `Failed to trigger broadcast: ${message}`,
    };
  }
}
