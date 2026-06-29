import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_MARKETING_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Segment ID → Resend Audience ID mapping
const SEGMENT_MAP: Record<string, string> = {
  "8324468f-0399-4c05-9b98-3e17e76ffa41": "marketing", // Marketing segment
  "42a3da82-ad27-475f-b2ad-113c9c8fa6b8": "application", // Application users segment
};

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate authorization header — must include service role key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { campaign_id?: string; approved_by?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { campaign_id, approved_by } = body;

  if (!campaign_id) {
    return new Response(JSON.stringify({ error: "campaign_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── 1. Fetch the campaign ────────────────────────────────────────────────
  const { data: campaign, error: fetchErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (fetchErr || !campaign) {
    return new Response(
      JSON.stringify({ error: "Campaign not found", details: fetchErr?.message }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 2. Safety gate — must be in 'draft' status ───────────────────────────
  if (campaign.status !== "draft") {
    return new Response(
      JSON.stringify({
        error: `Cannot send campaign with status '${campaign.status}'. Only 'draft' campaigns can be sent.`,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 3. Resolve html_content ──────────────────────────────────────────────
  const htmlContent = campaign.metadata?.html_content || campaign.content;
  const textContent = campaign.metadata?.text_content || "";

  if (!htmlContent) {
    return new Response(
      JSON.stringify({ error: "Campaign has no html_content to send." }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 4. Get audience ID from segment_id ───────────────────────────────────
  const audienceId = SEGMENT_MAP[campaign.segment_id];
  if (!audienceId) {
    return new Response(
      JSON.stringify({ error: `Unknown segment_id: ${campaign.segment_id}` }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 5. Create Resend broadcast ───────────────────────────────────────────
  let resendBroadcastId: string;
  try {
    const createRes = await fetch("https://api.resend.com/broadcasts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience_id: audienceId,
        from: "ABRAM <noreply@abram.network>",
        subject: campaign.subject,
        html: htmlContent,
        text: textContent,
        name: campaign.title,
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      throw new Error(createData?.message || createRes.statusText);
    }

    resendBroadcastId = createData.id;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to create Resend broadcast", details: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 6. Send the Resend broadcast ─────────────────────────────────────────
  try {
    const sendRes = await fetch(
      `https://api.resend.com/broadcasts/${resendBroadcastId}/send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!sendRes.ok) {
      const sendData = await sendRes.json();
      throw new Error(sendData?.message || sendRes.statusText);
    }
  } catch (err) {
    // Broadcast was created but send failed — store the broadcast ID anyway
    await supabase
      .from("campaigns")
      .update({ resend_broadcast_id: resendBroadcastId, status: "draft" })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({
        error: "Broadcast created in Resend but send failed",
        resend_broadcast_id: resendBroadcastId,
        details: String(err),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 7. Update campaign status in DB ─────────────────────────────────────
  await supabase
    .from("campaigns")
    .update({
      status: "sent",
      resend_broadcast_id: resendBroadcastId,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign_id);

  // ── 8. Log the send event ────────────────────────────────────────────────
  await supabase.from("campaign_logs").insert({
    campaign_id,
    event: "sent",
    recipient_count: campaign.recipients_count ?? 0,
    sent_at: new Date().toISOString(),
    metadata: {
      approved_by: approved_by ?? "claude",
      approval_steps_completed: 2,
      resend_broadcast_id: resendBroadcastId,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      campaign_id,
      resend_broadcast_id: resendBroadcastId,
      message: `Campaign "${campaign.title}" sent successfully via Resend broadcast ${resendBroadcastId}.`,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
