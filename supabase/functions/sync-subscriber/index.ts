import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

Deno.serve(async (req) => {
  // Check authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUBSCRIBER_SYNC_TOKEN") || "abram_db_sync_secret_token_123"}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const payload = await req.json();
    const { event, record } = payload;

    if (!record || !record.email) {
      return new Response(JSON.stringify({ error: "Invalid payload: missing record or email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { id, email, first_name, last_name, is_marketing_list, is_application_list, status, resend_contact_id } = record;

    // 1. Initialize Resend Key (prefers RESEND_MARKETING_API_KEY as requested)
    const resendKey = Deno.env.get("RESEND_MARKETING_API_KEY") || Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_MARKETING_API_KEY or RESEND_API_KEY is not configured in Supabase Secrets.");
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Resolve audience and segments
    const marketingSegmentId = Deno.env.get("RESEND_MARKETING_SEGMENT_ID") || "8324468f-0399-4c05-9b98-3e17e76ffa41";
    const applicationSegmentId = Deno.env.get("RESEND_APPLICATION_SEGMENT_ID") || "42a3da82-ad27-475f-b2ad-113c9c8fa6b8";

    const segments = [];
    if (is_marketing_list) segments.push({ id: marketingSegmentId });
    if (is_application_list) segments.push({ id: applicationSegmentId });

    const unsubscribed = status === "unsubscribed";

    let newResendContactId = resend_contact_id;

    // 3. Perform Resend Sync via HTTP REST API
    if (!resend_contact_id) {
      // Create Contact with segments array containing objects with id
      const res = await fetch("https://api.resend.com/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
          "User-Agent": "abram-supabase-edge/1.0"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: first_name || "",
          lastName: last_name || "",
          unsubscribed,
          ...(segments.length > 0 ? { segments } : {})
        })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Resend contact creation error:", data);
        throw new Error(data.message || "Failed to create contact in Resend.");
      }

      newResendContactId = data.id || null;
      console.log(`Created contact in Resend. ID: ${newResendContactId}`);
    } else {
      // Update Contact basic fields
      const res = await fetch(`https://api.resend.com/contacts/${resend_contact_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
          "User-Agent": "abram-supabase-edge/1.0"
        },
        body: JSON.stringify({
          firstName: first_name || undefined,
          lastName: last_name || undefined,
          unsubscribed
        })
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Resend contact update error:", data);
        throw new Error(data.message || "Failed to update contact in Resend.");
      }

      console.log(`Updated contact properties in Resend. ID: ${resend_contact_id}`);

      // Sync Segment memberships for existing contact
      const currentSegmentsRes = await fetch(`https://api.resend.com/contacts/${resend_contact_id}/segments`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "User-Agent": "abram-supabase-edge/1.0"
        }
      });
      
      if (currentSegmentsRes.ok) {
        const currentSegmentsPayload = await currentSegmentsRes.json();
        const currentSegmentIds = new Set((currentSegmentsPayload.data || []).map((s: any) => s.id));
        
        // Handle Marketing segment membership
        if (is_marketing_list && !currentSegmentIds.has(marketingSegmentId)) {
          console.log(`Adding contact ${resend_contact_id} to Marketing segment ${marketingSegmentId}`);
          await fetch(`https://api.resend.com/contacts/${resend_contact_id}/segments/${marketingSegmentId}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "User-Agent": "abram-supabase-edge/1.0" }
          });
        } else if (!is_marketing_list && currentSegmentIds.has(marketingSegmentId)) {
          console.log(`Removing contact ${resend_contact_id} from Marketing segment ${marketingSegmentId}`);
          await fetch(`https://api.resend.com/contacts/${resend_contact_id}/segments/${marketingSegmentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${resendKey}`, "User-Agent": "abram-supabase-edge/1.0" }
          });
        }
        
        // Handle Application segment membership
        if (is_application_list && !currentSegmentIds.has(applicationSegmentId)) {
          console.log(`Adding contact ${resend_contact_id} to Application segment ${applicationSegmentId}`);
          await fetch(`https://api.resend.com/contacts/${resend_contact_id}/segments/${applicationSegmentId}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "User-Agent": "abram-supabase-edge/1.0" }
          });
        } else if (!is_application_list && currentSegmentIds.has(applicationSegmentId)) {
          console.log(`Removing contact ${resend_contact_id} from Application segment ${applicationSegmentId}`);
          await fetch(`https://api.resend.com/contacts/${resend_contact_id}/segments/${applicationSegmentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${resendKey}`, "User-Agent": "abram-supabase-edge/1.0" }
          });
        }
      } else {
        console.error(`Failed to fetch current segments for contact ${resend_contact_id}`);
      }
    }

    // 4. Update the DB record with resend_contact_id if it changed/new
    if (newResendContactId && newResendContactId !== resend_contact_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: dbError } = await supabase
        .from("subscribers")
        .update({ resend_contact_id: newResendContactId })
        .eq("id", id);

      if (dbError) {
        console.error("Failed to update subscriber resend_contact_id in database:", dbError);
        throw dbError;
      }
      console.log(`Database updated with contact ID: ${newResendContactId}`);
    }

    return new Response(JSON.stringify({ success: true, resendContactId: newResendContactId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Sync function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
