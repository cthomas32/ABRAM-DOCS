import { NextResponse } from "next/server";
import { addSubscriber } from "@/utils/resend";

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
