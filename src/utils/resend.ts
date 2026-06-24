import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/**
 * Creates a service-role Supabase client to execute database operations
 * that bypass Row-Level Security (RLS) constraints.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key in environment variables.");
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
  jobTitle?: string;
  companySize?: string;
  isMarketingList?: boolean;
  isApplicationList?: boolean;
}

/**
 * Subscribes a user to the mailing list (persists to Supabase database).
 * Runs using the service-role client to ensure correct permission level.
 */
export async function addSubscriber(input: SubscribeInput) {
  const supabase = createServiceClient();

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

  if (existingSub && existingSub.status === "subscribed") {
    // Check if lists need updating or if details are provided on a subsequent subscribe call
    const needsListUpdate = (isMarketing && !existingSub.is_marketing_list) || (isApp && !existingSub.is_application_list);
    const needsDetailsUpdate = input.firstName || input.lastName || input.jobTitle || input.companySize;

    if (needsListUpdate || needsDetailsUpdate) {
      try {
        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        };
        if (isMarketing) updatePayload.is_marketing_list = true;
        if (isApp) updatePayload.is_application_list = true;
        if (input.firstName) updatePayload.first_name = input.firstName;
        if (input.lastName) updatePayload.last_name = input.lastName;

        // Try updating details with self-healing fallback for role and company size columns
        try {
          const { error: updateError } = await supabase
            .from("subscribers")
            .update({
              ...updatePayload,
              job_title: input.jobTitle || undefined,
              company_size: input.companySize || undefined,
            })
            .eq("email", input.email);

          if (updateError) {
            if (updateError.message.includes("job_title") || updateError.message.includes("company_size")) {
              const { error: fallbackError } = await supabase
                .from("subscribers")
                .update(updatePayload)
                .eq("email", input.email);
              if (fallbackError) throw fallbackError;
            } else {
              throw updateError;
            }
          }
        } catch (dbErr: any) {
          console.warn("Database update failed during re-subscribe check (ignoring silently):", dbErr.message);
        }
      } catch (err: any) {
        console.error("Failed to update extra subscriber details during re-subscribe:", err);
      }
    }
    return { success: true, message: "You are already subscribed!", alreadySubscribed: true };
  }

  // 3. Persist subscriber to local database table
  const subscriberData: any = {
    email: input.email.trim().toLowerCase(),
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    status: "subscribed",
    is_marketing_list: isMarketing,
    is_application_list: isApp,
    updated_at: new Date().toISOString(),
  };

  // 4. Upsert with self-healing fallback for role and company size columns
  try {
    const { error: upsertError } = await supabase
      .from("subscribers")
      .upsert({
        ...subscriberData,
        job_title: input.jobTitle || null,
        company_size: input.companySize || null,
      }, { onConflict: "email" });

    if (upsertError) {
      if (upsertError.message.includes("job_title") || upsertError.message.includes("company_size")) {
        console.warn("Falling back to standard upsert (missing job_title/company_size columns in DB)...");
        const { error: fallbackError } = await supabase
          .from("subscribers")
          .upsert(subscriberData, { onConflict: "email" });
        
        if (fallbackError) throw fallbackError;
      } else {
        throw upsertError;
      }
    }
  } catch (err: any) {
    console.error("Supabase subscriber upsert error:", err.message);
    if (err.message.includes("row-level security policy") || err.message.includes("unique constraint") || err.message.includes("already exists")) {
      return { success: true, message: "You are already subscribed!", alreadySubscribed: true };
    }
    throw new Error(`Database Error: ${err.message}`);
  }

  return { success: true, message: "Successfully subscribed!" };
}

/**
 * Updates an existing subscriber's profile details.
 * Self-healing: handles missing job_title and company_size columns gracefully.
 */
export async function updateSubscriberDetails(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  companySize?: string;
}) {
  const supabase = createServiceClient();
  const email = input.email.trim().toLowerCase();

  const updateData: any = {
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("subscribers")
      .update({
        ...updateData,
        job_title: input.jobTitle || null,
        company_size: input.companySize || null,
      })
      .eq("email", email);

    if (error) {
      if (error.message.includes("job_title") || error.message.includes("company_size")) {
        console.warn("Falling back to standard update (missing job_title/company_size columns in DB)...");
        const { error: fallbackError } = await supabase
          .from("subscribers")
          .update(updateData)
          .eq("email", email);

        if (fallbackError) throw fallbackError;
        return { success: true, message: "Details updated! (Role/Company columns missing in DB)" };
      }
      throw error;
    }
  } catch (err: any) {
    console.error("Supabase subscriber update error:", err.message);
    throw new Error(`Database Error: ${err.message}`);
  }

  return { success: true, message: "Details updated successfully!" };
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
      from: process.env.RESEND_FROM_EMAIL || "ABRAM <updates@abram.network>",
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
