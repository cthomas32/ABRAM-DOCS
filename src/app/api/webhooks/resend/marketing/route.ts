import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyResendWebhook } from "@/lib/webhooks/svix";

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

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // The signature is read before anything else touches the body. An
    // unset secret refuses the delivery rather than waving it through:
    // see src/lib/webhooks/svix.ts for why.
    const verified = verifyResendWebhook(
      rawBody,
      request.headers,
      "RESEND_MARKETING_WEBHOOK_SECRET",
      "RESEND_WEBHOOK_SECRET"
    );
    if (!verified.ok) {
      console.warn(`Rejected Resend marketing webhook: ${verified.reason}`);
      return NextResponse.json({ error: verified.reason }, { status: verified.status });
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
        let isAppList = false;
        let isMarketingList = true;
        let jobTitleVal = null;
        let companySizeVal = null;

        if (contactId) {
          const { data: existingById, error: errorById } = await supabase
            .from("subscribers")
            .select("id, is_marketing_list, is_application_list, job_title, company_size")
            .eq("resend_contact_id", contactId)
            .maybeSingle();

          if (errorById) {
            console.error("Error fetching subscriber by resend_contact_id:", errorById.message);
          }

          if (existingById) {
            targetId = existingById.id;
            isAppList = existingById.is_application_list;
            isMarketingList = existingById.is_marketing_list;
            jobTitleVal = existingById.job_title;
            companySizeVal = existingById.company_size;
          }
        }

        if (!targetId && email) {
          const { data: existingByEmail, error: errorByEmail } = await supabase
            .from("subscribers")
            .select("id, is_marketing_list, is_application_list, job_title, company_size")
            .eq("email", email)
            .maybeSingle();

          if (errorByEmail) {
            console.error("Error fetching subscriber by email:", errorByEmail.message);
          }

          if (existingByEmail) {
            targetId = existingByEmail.id;
            isAppList = existingByEmail.is_application_list;
            isMarketingList = existingByEmail.is_marketing_list;
            jobTitleVal = existingByEmail.job_title;
            companySizeVal = existingByEmail.company_size;
          }
        }

        // Check if job_title and company_size columns exist in the database (self-healing DDL safety)
        const { error: colCheckError } = await supabase
          .from("subscribers")
          .select("job_title, company_size")
          .limit(1);
        const hasMarketingFields = !colCheckError;

        // Fetch properties from Resend API to see if they signed up for the app
        const apiKey = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
        if (apiKey && contactId) {
          try {
            const res = await fetch(`https://api.resend.com/contacts/${contactId}`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "User-Agent": "abram-next/1.0",
              },
            });
            if (res.ok) {
              const details = await res.json();
              const resendProps = details.properties || details.custom_properties || {};
              
              // Helper to extract nested property value if it is an object
              const getPropVal = (prop: any): string | null => {
                if (!prop) return null;
                if (typeof prop === "object" && "value" in prop) {
                  return prop.value ? String(prop.value) : null;
                }
                return String(prop);
              };

              const planTierVal = getPropVal(resendProps.planTier);
              const roleTypeVal = getPropVal(resendProps.roleType);
              const accountTypeVal = getPropVal(resendProps.accountType);

              jobTitleVal = getPropVal(resendProps.jobTitle || resendProps.job_title) || jobTitleVal;
              companySizeVal = getPropVal(resendProps.companySize || resendProps.company_size) || companySizeVal;

              if (planTierVal || accountTypeVal || roleTypeVal) {
                isAppList = true;
                isMarketingList = true;
              }
            }
          } catch (err) {
            console.error(`Failed to fetch contact details for ${contactId} in webhook:`, err);
          }
        }

        const subscriberData: any = {
          email: email,
          resend_contact_id: contactId || null,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          status: status,
          is_marketing_list: isMarketingList,
          is_application_list: isAppList,
          updated_at: new Date().toISOString(),
        };

        if (hasMarketingFields) {
          subscriberData.job_title = jobTitleVal;
          subscriberData.company_size = companySizeVal;
        }

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
