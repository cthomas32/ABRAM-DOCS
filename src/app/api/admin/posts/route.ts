/**
 * Blog post writes.
 *
 * Two callers, two credentials, and the difference matters:
 *
 * - **A signed-in console user.** Checked with `readConsoleUser` plus
 *   `can(user, "content.blog")`, and then the write goes through THEIR
 *   client, so the `blog_posts` policies apply. A route that authenticates
 *   somebody and then writes as the service role has thrown away the
 *   database's opinion, which is the only opinion that holds when a role
 *   changes later.
 * - **A machine holding `ADMIN_API_KEY`.** The publishing scripts have no
 *   session. That path uses the service role because it has no user to
 *   scope to, and it is refused outright when the key is not configured,
 *   so a missing env var closes the door rather than opening it.
 *
 * Anything else gets 401 before the body is read.
 */

import { NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

type Writer = {
  client: {
    from: (table: string) => any;
  };
  /** For the log line, so a bad write can be traced to who made it. */
  actor: string;
};

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createServiceRoleClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves the caller to a client that may write, or null.
 *
 * Order matters: the session is tried first so an editor with a browser
 * session is scoped by RLS even on a deployment that also holds the key.
 */
async function authorize(request: Request): Promise<Writer | null> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (user && can(user, "content.blog")) {
    return { client: supabase, actor: user.email || user.userId };
  }

  const expectedKey = process.env.ADMIN_API_KEY;
  const presentedKey = request.headers.get("x-api-key");
  if (expectedKey && presentedKey && presentedKey === expectedKey) {
    const service = serviceRoleClient();
    if (!service) {
      console.error("ADMIN_API_KEY accepted but SUPABASE_SERVICE_ROLE_KEY is not configured.");
      return null;
    }
    return { client: service, actor: "admin-api-key" };
  }

  return null;
}

const UNAUTHORIZED = NextResponse.json(
  { error: "You do not have permission to write blog posts." },
  { status: 401 }
);

export async function POST(request: Request) {
  const writer = await authorize(request);
  if (!writer) return UNAUTHORIZED;

  try {
    const body = await request.json();
    const { title, slug, summary, content, status, author, published_at } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, and content are required." },
        { status: 400 }
      );
    }

    const { data, error } = await writer.client
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
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`Error inserting blog post (actor ${writer.actor}):`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/admin/posts:", error);
    return NextResponse.json({ error: error.message || "Invalid JSON or server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const writer = await authorize(request);
  if (!writer) return UNAUTHORIZED;

  try {
    const body = await request.json();
    const { id, slug, title, summary, content, status, author, published_at } = body;

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Missing identifier: either id or slug must be provided to update a post." },
        { status: 400 }
      );
    }

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

    let query = writer.client.from("blog_posts").update(updateData);

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error(`Error updating blog post (actor ${writer.actor}):`, error);
      // PGRST116 is "no row matched", which here also covers a row the
      // caller's policies hide from them. Not found is the honest answer
      // to both.
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
