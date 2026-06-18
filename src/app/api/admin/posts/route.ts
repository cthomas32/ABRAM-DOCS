import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client.
// We prefer SUPABASE_SERVICE_ROLE_KEY to bypass Row-Level Security (RLS) for admin write operations.
// Fallback to publishable key if service role key is not defined in the environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to verify API key
function isAuthorized(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    console.error("ADMIN_API_KEY is not defined in the environment variables.");
    return false;
  }
  
  return apiKey === expectedKey;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, summary, content, status, author, published_at } = body;

    // Basic validation
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, and content are required." },
        { status: 400 }
      );
    }

    // Insert new blog post
    const { data, error } = await supabase
      .from("blog_posts")
      .insert([
        {
          title,
          slug,
          summary: summary !== undefined ? summary : null,
          content,
          status: status || "draft",
          author: author || "ABRAM Team",
          published_at: published_at ? new Date(published_at).toISOString() : null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting blog post:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/admin/posts:", error);
    return NextResponse.json({ error: error.message || "Invalid JSON or server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, slug, title, summary, content, status, author, published_at } = body;

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Missing identifier: either id or slug must be provided to update a post." },
        { status: 400 }
      );
    }

    // Prepare update data (only update fields that are explicitly provided)
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (author !== undefined) updateData.author = author;
    if (published_at !== undefined) {
      updateData.published_at = published_at ? new Date(published_at).toISOString() : null;
    }
    updateData.updated_at = new Date().toISOString();

    // Query builder
    let query = supabase.from("blog_posts").update(updateData);

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error("Error updating blog post:", error);
      // If no row matches the given filter, Supabase single() returns PGRST116
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("Error in PUT /api/admin/posts:", error);
    return NextResponse.json({ error: error.message || "Invalid JSON or server error" }, { status: 500 });
  }
}
