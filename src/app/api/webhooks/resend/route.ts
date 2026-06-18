import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Standard Resend webhook event structure
interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    id: string; // Resend email/event ID
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    status?: string;
    // Bounces/Complaints metadata
    error?: {
      message: string;
      code: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ResendWebhookPayload;
    const { type, data } = payload;

    console.log(`Received Resend Webhook [${type}] for email ID: ${data.id}`);

    // Initializing Supabase client with bypass capabilities if needed,
    // or standard server client.
    const supabase = await createClient();

    // 1. Log the raw event to campaign_logs
    const { error: logError } = await supabase.from("campaign_logs").insert({
      event_type: type,
      recipient_email: data.to?.[0] || null,
      payload: payload,
    });

    if (logError) {
      console.error("Failed to insert campaign log:", logError.message);
    }

    // 2. Handle specific event type behaviors
    switch (type) {
      case "email.bounced":
      case "email.complained":
      case "email.suppressed": {
        // If a contact's email bounces, mark them as unsubscribed/bounced locally
        const email = data.to?.[0];
        if (email) {
          console.warn(`Email bounced or complained: ${email}. Marking as unsubscribed.`);
          await supabase
            .from("subscribers")
            .update({
              status: "bounced",
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);
        }
        break;
      }

      case "email.delivered": {
        // Update general campaign statistics if linked to a broadcast
        // Normally Resend webhooks include custom tags we can send.
        // Let's check for an email tag identifying the campaign_id.
        break;
      }

      case "email.opened":
      case "email.clicked": {
        // Log open/click action details
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
