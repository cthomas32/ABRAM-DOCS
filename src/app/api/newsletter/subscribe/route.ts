import { NextResponse } from "next/server";
import { syncFeedPerson } from "@/lib/crm/contactSync";
import { linkSubscriberToContacts } from "@/lib/crm/subscriberLink";
import { addSubscriber, createServiceClient } from "@/utils/resend";

/**
 * Public API endpoint for subscribing users to the newsletter.
 * POST /api/newsletter/subscribe
 */
export async function POST(request: Request) {
  try {
    // 1. Parse JSON body safely
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { email, firstName, lastName } = body;

    // 2. Validate required email field
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // 3. Call utility function for db upsert and Resend contact creation
    const result = await addSubscriber({
      email: email.trim().toLowerCase(),
      firstName: typeof firstName === "string" ? firstName.trim() : undefined,
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
    });

    // 4. Make them a person.
    //
    // Two steps, and they do different jobs. The link writes the "they
    // came back on their own" note on anybody already in the CRM, which is
    // the conference case: you met them in March and they signed up in
    // May. The sync is what was missing, and its absence was the largest
    // hole in the contact spine. `linkSubscriberToContacts` only ever
    // *updates* rows that already exist, so until now a stranger who
    // subscribed from the site was recorded in `subscribers` and nowhere
    // else. They stayed invisible to the CRM until somebody noticed and
    // clicked convert by hand, which is a step nobody remembers to take.
    //
    // `syncFeedPerson` is idempotent by construction: it matches on
    // lowercased email, adds `newsletter` to the source array, advances
    // the lifecycle without ever moving anybody backwards, and only
    // inserts when nothing matched. Running it on somebody the link just
    // handled changes nothing.
    //
    // The service client is deliberate. This route is public and anonymous
    // and row level security correctly refuses an anonymous insert into
    // the contact table. The values written are fixed here rather than
    // taken from the request, so the elevated client cannot be steered:
    // the caller chooses an email address and nothing else.
    //
    // Both are strictly side effects. Neither may fail a signup, so both
    // are caught and logged. Somebody who ticked the box is subscribed
    // whatever the CRM does next.
    const cleanEmail = email.trim().toLowerCase();

    try {
      await linkSubscriberToContacts(cleanEmail);
    } catch (linkError) {
      console.error("Newsletter subscription: contact link failed:", linkError);
    }

    try {
      const service = createServiceClient();
      const { data: subscriber } = await service
        .from("subscribers")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      const synced = await syncFeedPerson(service, {
        email: cleanEmail,
        fullName: [firstName, lastName]
          .filter((part) => typeof part === "string" && part.trim())
          .join(" ")
          .trim() || null,
        source: "newsletter",
        lifecycle: "subscriber",
        subscriberId: (subscriber?.id as string | undefined) ?? null,
      });

      if (!synced.ok) {
        console.error("Newsletter subscription: contact sync refused:", synced.error);
      }
    } catch (syncError) {
      console.error("Newsletter subscription: contact sync threw:", syncError);
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Successfully subscribed!",
      alreadySubscribed: !!(result as any).alreadySubscribed,
    });
  } catch (error: unknown) {
    console.error("Newsletter subscription API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
