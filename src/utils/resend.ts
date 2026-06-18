import { Resend } from "resend";
import { createClient } from "./supabase/server";

/**
 * Retrieves the Resend client instance safely.
 * If the API key is not configured, it returns null and logs a warning,
 * preventing server-side or build-time crashes when environment variables are missing.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "Resend API integration is disabled: RESEND_API_KEY is not defined in environment variables."
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
}

/**
 * Subscribes a user to the mailing list (adds contact in Resend & logs to Supabase database).
 * This runs entirely on the server side via Server Actions.
 */
export async function addSubscriber(input: SubscribeInput) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Resend integration is not configured on the server.");
  }

  const supabase = await createClient();

  // 1. Check if the contact already exists locally or in Resend
  const { data: existingSub, error: dbError } = await supabase
    .from("subscribers")
    .select("*")
    .eq("email", input.email)
    .maybeSingle();

  if (dbError) {
    console.error("Local database subscriber check failed:", dbError.message);
  }

  if (existingSub && existingSub.status === "subscribed") {
    return { success: true, message: "You are already subscribed!" };
  }

  // 2. Call Resend API to create contact
  // Default to assigning the contact to a "General" segment (ID should be configured in env)
  const generalSegmentId = process.env.RESEND_GENERAL_SEGMENT_ID;

  let resendContactId = existingSub?.resend_contact_id || null;

  try {
    if (!resendContactId) {
      const contactResponse = await resend.contacts.create({
        email: input.email,
        firstName: input.firstName || "",
        lastName: input.lastName || "",
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID || "", // Required in Resend API v1
        ...(generalSegmentId ? { segmentIds: [generalSegmentId] } : {}),
      });

      if (contactResponse.error) {
        throw new Error(contactResponse.error.message);
      }
      resendContactId = contactResponse.data?.id || null;
    } else {
      // Re-subscribe if unsubscribed
      await resend.contacts.update({
        id: resendContactId,
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID || "",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Resend API contact creation error:", err);
    throw new Error(`Resend Error: ${message || "Failed to add subscriber contact."}`);
  }

  // 3. Persist subscriber to local database table
  const subscriberData = {
    email: input.email,
    first_name: input.firstName || null,
    last_name: input.lastName || null,
    resend_contact_id: resendContactId,
    status: "subscribed",
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("subscribers")
    .upsert(subscriberData, { onConflict: "email" });

  if (upsertError) {
    console.error("Supabase subscriber upsert error:", upsertError.message);
    // Return success since the subscriber was successfully registered in Resend
  }

  return { success: true, message: "Successfully subscribed!" };
}

interface CreateBroadcastInput {
  title: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  segmentId?: string; // Optional segment ID (falls back to General segment)
}

/**
 * Creates and sends a Resend Broadcast to all contacts in a segment.
 * Logs the campaign execution in Supabase.
 */
export async function triggerBroadcastCampaign(input: CreateBroadcastInput) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Resend integration is not configured on the server.");
  }

  const supabase = await createClient();
  const segmentId = input.segmentId || process.env.RESEND_GENERAL_SEGMENT_ID;

  if (!segmentId) {
    throw new Error("A valid Resend segment ID must be specified for broadcasts.");
  }

  // 1. Log campaign initiation in database as "draft/initiating"
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      title: input.title,
      subject: input.subject,
      segment_id: segmentId,
      status: "sending",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (campaignError) {
    console.error("Failed to log campaign startup in database:", campaignError.message);
  }

  try {
    // 2. Create the Broadcast in Resend
    const broadcastResponse = await resend.broadcasts.create({
      name: input.title,
      from: process.env.RESEND_FROM_EMAIL || "ABRAM Team <team@abram.network>",
      subject: input.subject,
      text: input.textContent,
      html: input.htmlContent,
      segmentId: segmentId,
    });

    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.error.message);
    }

    const resendBroadcastId = broadcastResponse.data?.id;
    if (!resendBroadcastId) {
      throw new Error("Resend API failed to return a valid Broadcast ID.");
    }

    // 3. Send the Broadcast immediately
    const sendResponse = await resend.broadcasts.send(resendBroadcastId);

    if (sendResponse.error) {
      throw new Error(sendResponse.error.message);
    }

    // 4. Update local campaign log with Resend Broadcast ID and success status
    if (campaign) {
      await supabase
        .from("campaigns")
        .update({
          resend_broadcast_id: resendBroadcastId,
          status: "sent",
        })
        .eq("id", campaign.id);
    }

    return {
      success: true,
      broadcastId: resendBroadcastId,
      message: "Broadcast sent successfully to segment subscribers.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Broadcast transmission error:", error);
    
    // Log failure status
    if (campaign) {
      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          metadata: { error: message },
        })
        .eq("id", campaign.id);
    }

    return {
      success: false,
      message: `Failed to trigger broadcast: ${message}`,
    };
  }
}
