import { NextResponse } from "next/server";
import { updateSubscriberDetails } from "@/utils/resend";

/**
 * Public API endpoint for updating subscriber profile details.
 * POST /api/newsletter/update-details
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

    const { email, firstName, lastName, jobTitle, companySize } = body;

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

    // 3. Call utility function for db update
    const result = await updateSubscriberDetails({
      email: email.trim().toLowerCase(),
      firstName: typeof firstName === "string" ? firstName.trim() : undefined,
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
      jobTitle: typeof jobTitle === "string" ? jobTitle.trim() : undefined,
      companySize: typeof companySize === "string" ? companySize.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: result.message || "Profile details updated successfully!",
    });
  } catch (error: unknown) {
    console.error("Newsletter update details API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
