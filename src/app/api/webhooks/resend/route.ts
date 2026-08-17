import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/resend";

// Standard Resend webhook event structure
interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    id: string; // Resend email/event ID
    email_id?: string; // Resend email message ID
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    status?: string;
    broadcast_id?: string;
    tags?: any;
    // Bounces/Complaints metadata
    error?: {
      message: string;
      code: string;
    };
    // Present on email.clicked. The link that was followed.
    click?: {
      link?: string;
      timestamp?: string;
    };
  };
}

/**
 * Extracts campaign_id from the tags object or array in the webhook payload.
 */
function extractCampaignIdFromTags(payload: any): string | null {
  if (!payload) return null;
  const data = payload.data;

  // 1. Check data.tags (object)
  if (data?.tags && typeof data.tags === "object" && !Array.isArray(data.tags)) {
    if (data.tags.campaign_id) return String(data.tags.campaign_id);
  }

  // 2. Check payload.tags (object)
  if (payload.tags && typeof payload.tags === "object" && !Array.isArray(payload.tags)) {
    if (payload.tags.campaign_id) return String(payload.tags.campaign_id);
  }

  // 3. Check data.tags (array of objects)
  if (Array.isArray(data?.tags)) {
    const found = data.tags.find(
      (t: any) =>
        t &&
        typeof t === "object" &&
        (t.name === "campaign_id" || t.key === "campaign_id")
    );
    if (found?.value) return String(found.value);
  }

  // 4. Check payload.tags (array of objects)
  if (Array.isArray(payload.tags)) {
    const found = payload.tags.find(
      (t: any) =>
        t &&
        typeof t === "object" &&
        (t.name === "campaign_id" || t.key === "campaign_id")
    );
    if (found?.value) return String(found.value);
  }

  return null;
}

/**
 * Maps Resend webhook event types to campaign_logs allowed status values.
 * CHECK status IN ('sent', 'delivered', 'failed', 'opened', 'clicked')
 */
function mapEventTypeToStatus(eventType: string): "sent" | "delivered" | "failed" | "opened" | "clicked" {
  switch (eventType) {
    case "email.sent":
      return "sent";
    case "email.delivered":
      return "delivered";
    case "email.opened":
      return "opened";
    case "email.clicked":
      return "clicked";
    case "email.bounced":
    case "email.complained":
    case "email.suppressed":
      return "failed";
    default:
      if (eventType.includes("click")) return "clicked";
      if (eventType.includes("open")) return "opened";
      if (eventType.includes("deliver")) return "delivered";
      if (eventType.includes("bounce") || eventType.includes("fail") || eventType.includes("complain")) {
        return "failed";
      }
      return "sent";
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ResendWebhookPayload;
    const { type, data } = payload;

    const emailIdLog = data?.email_id || data?.id;
    console.log(`Received Resend Webhook [${type}] for email ID: ${emailIdLog}`);

    // Webhooks are automated backend requests, so we must use a service client
    // to bypass RLS policies for reading campaigns/subscribers/logs and writing updates.
    const supabase = createServiceClient();

    let campaignId: string | null = null;
    let subscriberId: string | null = null;

    const recipientEmail = data?.to?.[0];

    // 1. Find subscriber by email
    if (recipientEmail) {
      try {
        const { data: subscriber, error: subError } = await supabase
          .from("subscribers")
          .select("id")
          .eq("email", recipientEmail.trim().toLowerCase())
          .maybeSingle();

        if (subError) {
          console.error(`Error looking up subscriber by email (${recipientEmail}):`, subError.message);
        } else if (subscriber) {
          subscriberId = subscriber.id;
        }
      } catch (err: unknown) {
        console.error("Unexpected error looking up subscriber:", err);
      }
    }

    // 2. Resolve campaign_id
    // A. Check if broadcast_id is present
    const broadcastId = data?.broadcast_id || (payload as any)?.broadcast_id;
    if (broadcastId) {
      try {
        const { data: campaign, error: campaignError } = await supabase
          .from("campaigns")
          .select("id")
          .eq("resend_broadcast_id", broadcastId)
          .maybeSingle();

        if (campaignError) {
          console.error(`Error looking up campaign by broadcast_id (${broadcastId}):`, campaignError.message);
        } else if (campaign) {
          campaignId = campaign.id;
        }
      } catch (err: unknown) {
        console.error("Unexpected error looking up campaign by broadcast_id:", err);
      }
    }

    // B. If not resolved, check tags
    if (!campaignId) {
      const tagCampaignId = extractCampaignIdFromTags(payload);
      if (tagCampaignId) {
        try {
          const { data: campaign, error: campaignError } = await supabase
            .from("campaigns")
            .select("id")
            .eq("id", tagCampaignId)
            .maybeSingle();

          if (campaignError) {
            console.error(`Error looking up campaign by tag campaign_id (${tagCampaignId}):`, campaignError.message);
          } else if (campaign) {
            campaignId = campaign.id;
          }
        } catch (err: unknown) {
          console.error("Unexpected error looking up campaign by tag campaign_id:", err);
        }
      }
    }

    // C. If not resolved, check by Resend email ID in existing logs
    const emailId = data?.email_id || data?.id;
    if (!campaignId && emailId) {
      try {
        const { data: existingLogs, error: lookupError } = await supabase
          .from("campaign_logs")
          .select("campaign_id")
          .or(`payload->data->>id.eq.${emailId},payload->>resend_email_id.eq.${emailId},payload->data->>email_id.eq.${emailId}`)
          .not("campaign_id", "is", null)
          .limit(1);

        if (lookupError) {
          console.error(`Error looking up campaign by email_id (${emailId}) in campaign_logs:`, lookupError.message);
        } else if (existingLogs && existingLogs.length > 0) {
          campaignId = existingLogs[0].campaign_id;
        }
      } catch (err: unknown) {
        console.error("Unexpected error looking up campaign by email_id in logs:", err);
      }
    }

    // 3. Map event type to status and error message
    const status = mapEventTypeToStatus(type);
    const errorMessage = data?.error?.message || null;

    // 4. Log the event to campaign_logs
    const { error: logError } = await supabase.from("campaign_logs").insert({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      status: status,
      event_type: type,
      recipient_email: recipientEmail || null,
      payload: payload,
      error_message: errorMessage,
    });

    if (logError) {
      console.error("Failed to insert campaign log:", logError.message);
    }

    // 4b. Keep the campaign's recipient count honest.
    // A segment broadcast is expanded by Resend, so the send itself can only ever
    // estimate its audience. These events are the real thing, so recompute the count
    // from them as they land. Recomputing rather than incrementing keeps concurrent
    // webhook deliveries and Resend's retries from inflating the number.
    if (campaignId && type === "email.sent") {
      const { error: reconcileError } = await supabase.rpc(
        "reconcile_campaign_recipients_count",
        { p_campaign_id: campaignId }
      );

      if (reconcileError) {
        console.error(
          `Failed to reconcile recipient count for campaign ${campaignId}:`,
          reconcileError.message
        );
      }
    }

    // 4c. Put the engagement on the person's timeline.
    //
    // campaign_logs answers "how did that broadcast do". This answers the
    // question somebody actually asks while looking at a contact: has
    // this one read anything I sent them?
    //
    // Deduplication is the database's job, not this handler's — an open
    // is a pixel that loads every time the message is scrolled past, and
    // Resend retries, so two deliveries regularly arrive together and a
    // read-then-write here would let both through. See
    // crm_record_email_engagement and the unique index behind it.
    //
    // Wrapped so that a failure here can never fail the webhook. Resend
    // retries a non-200, and retrying a delivery because a timeline write
    // failed would replay the campaign log too.
    if (recipientEmail && (type === "email.opened" || type === "email.clicked")) {
      try {
        const { error: engagementError } = await supabase.rpc("crm_record_email_engagement", {
          p_email: recipientEmail,
          p_kind: type === "email.opened" ? "email_opened" : "email_clicked",
          p_email_id: emailId ?? null,
          p_url: data?.click?.link ?? null,
          p_subject: data?.subject ?? null,
          p_occurred_at: data?.click?.timestamp || payload.created_at || null,
        });

        if (engagementError) {
          console.error("Failed to record CRM engagement:", engagementError.message);
        }
      } catch (err: unknown) {
        console.error("Unexpected error recording CRM engagement:", err);
      }
    }

    // 5. Handle specific event type behaviors
    switch (type) {
      case "email.bounced":
      case "email.complained":
      case "email.suppressed": {
        if (recipientEmail) {
          console.warn(`Email bounced, complained, or suppressed for: ${recipientEmail}. Marking subscriber as bounced.`);
          try {
            const { error: updateError } = await supabase
              .from("subscribers")
              .update({
                status: "bounced",
                updated_at: new Date().toISOString(),
              })
              .eq("email", recipientEmail.trim().toLowerCase());

            if (updateError) {
              console.error(`Failed to update subscriber status for ${recipientEmail}:`, updateError.message);
            }
          } catch (err: unknown) {
            console.error("Unexpected error updating subscriber status:", err);
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error processing Resend Webhook:", message);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
