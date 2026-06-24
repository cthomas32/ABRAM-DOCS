import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface ResendContactWebhookPayload {
  type: string;
  created_at?: string;
  data?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    unsubscribed?: boolean;
  };
}

function verifySignature(rawBody: string, headers: Headers, secret: string): boolean {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Check timestamp age to prevent replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(svixTimestamp, 10);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    return false;
  }

  // Construct the signed content
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

  // Prepare secret bytes (strip 'whsec_' and decode base64)
  const secretBytes = Buffer.from(secret.split("_")[1], "base64");

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatures = svixSignature.split(" ");
  return signatures.includes(expectedSignature);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // Verify webhook signature if secret is configured
    const secret = process.env.RESEND_MARKETING_WEBHOOK_SECRET;
    if (secret) {
      const isVerified = verifySignature(rawBody, headers, secret);
      if (!isVerified) {
        console.warn("Unauthorized: Invalid Svix signature received from Resend webhook.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("RESEND_MARKETING_WEBHOOK_SECRET is not configured on the server. Skipping verification.");
    }

    const payload = JSON.parse(rawBody) as ResendContactWebhookPayload;
    const { type, data } = payload || {};

    if (!type || !data) {
      console.warn("Received Resend Webhook with missing type or data payload:", payload);
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    console.log(`Received Resend Contact Webhook [${type}] for contact ID: ${data.id}, email: ${data.email}`);

    const supabase = await createClient();

    switch (type) {
      case "contact.created":
      case "contact.updated": {
        const contactId = data.id;
        const email = data.email;
        if (!email) {
          console.error("Missing email in contact webhook payload:", payload);
          return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // Map unsubscribed boolean to status: true -> unsubscribed, false -> subscribed
        const status = data.unsubscribed ? "unsubscribed" : "subscribed";

        // Look up existing subscriber to prevent violating UNIQUE constraints or creating duplicates.
        // We match by resend_contact_id first, then by email.
        let targetId: string | null = null;

        if (contactId) {
          const { data: existingById, error: errorById } = await supabase
            .from("subscribers")
            .select("id")
            .eq("resend_contact_id", contactId)
            .maybeSingle();

          if (errorById) {
            console.error("Error fetching subscriber by resend_contact_id:", errorById.message);
          }

          if (existingById) {
            targetId = existingById.id;
          }
        }

        if (!targetId && email) {
          const { data: existingByEmail, error: errorByEmail } = await supabase
            .from("subscribers")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (errorByEmail) {
            console.error("Error fetching subscriber by email:", errorByEmail.message);
          }

          if (existingByEmail) {
            targetId = existingByEmail.id;
          }
        }

        const subscriberData = {
          email: email,
          resend_contact_id: contactId || null,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          status: status,
          updated_at: new Date().toISOString(),
        };

        if (targetId) {
          console.log(`Updating existing subscriber with ID ${targetId}`);
          const { error: updateError } = await supabase
            .from("subscribers")
            .update(subscriberData)
            .eq("id", targetId);

          if (updateError) {
            console.error("Error updating subscriber:", updateError.message);
            throw updateError;
          }
        } else {
          console.log(`Inserting new subscriber: ${email}`);
          const { error: insertError } = await supabase
            .from("subscribers")
            .insert(subscriberData);

          if (insertError) {
            console.error("Error inserting subscriber:", insertError.message);
            throw insertError;
          }
        }
        break;
      }

      case "contact.deleted": {
        const contactId = data.id;
        const email = data.email;

        let targetId: string | null = null;

        if (contactId) {
          const { data: existingById } = await supabase
            .from("subscribers")
            .select("id")
            .eq("resend_contact_id", contactId)
            .maybeSingle();
          if (existingById) {
            targetId = existingById.id;
          }
        }

        if (!targetId && email) {
          const { data: existingByEmail } = await supabase
            .from("subscribers")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (existingByEmail) {
            targetId = existingByEmail.id;
          }
        }

        if (targetId) {
          console.log(`Deleting subscriber with ID ${targetId}`);
          const { error: deleteError } = await supabase
            .from("subscribers")
            .delete()
            .eq("id", targetId);

          if (deleteError) {
            console.error("Error deleting subscriber:", deleteError.message);
            throw deleteError;
          }
        } else {
          console.log("No matching subscriber found to delete.");
        }
        break;
      }

      default:
        console.log(`Unhandled Resend Contact Webhook event: ${type}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in Resend Marketing Webhook:", message);
    return NextResponse.json(
      { error: "Webhook processing failed", details: message },
      { status: 500 }
    );
  }
}
