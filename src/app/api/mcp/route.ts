import { NextResponse } from "next/server";
import { can } from "@/lib/auth/permissions";
import { failureMessage, identify } from "@/lib/mcp/session";
import { toolByName, visibleTools, type ToolContext } from "@/lib/mcp/tools";

/**
 * The CRM, spoken to.
 *
 * A teammate adds this URL to Claude with a token from
 * /admin/dashboard/team, and asks questions in words. What comes back is
 * scoped by row level security to what their own login can already read,
 * because `identify` hands every tool a database session that is them.
 * See src/lib/mcp/session.ts for why that matters more than it sounds.
 *
 * **Written by hand rather than with the SDK, deliberately.** What Claude
 * needs from an MCP server over HTTP is a small, fully specified subset:
 * `initialize`, `tools/list`, `tools/call`, `ping`, and the courtesy of
 * ignoring notifications. That is the whole of what is below. The
 * alternative is a dependency whose protocol version has to be kept in
 * step with a client nobody here controls, in a repository that has
 * fifteen dependencies in total. If this ever needs resources, prompts or
 * sampling, take the SDK then and delete this: those are the parts worth
 * not writing twice.
 *
 * **Stateless.** Every request carries its own token and no session state
 * is kept between them beyond a cached database session keyed by token
 * hash. No Mcp-Session-Id, no SSE stream, no resumability. A serverless
 * function that pretends to hold a long lived stream is a function that
 * drops it at the first scale-to-zero.
 *
 * **Errors are answers, not failures.** A tool that refuses returns its
 * refusal as text with `isError` set, so the model can say "your login
 * cannot read that" instead of retrying a transport error four times.
 * The only real JSON-RPC errors here are a malformed request and an
 * unknown method.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The version we speak. Clients newer than this negotiate down to it. */
const PROTOCOL_VERSION = "2025-06-18";

interface RpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function ok(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  status = 200
) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });
}

/** A tool's answer, in the shape the protocol wants it. */
function content(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

export async function POST(request: Request) {
  let body: RpcRequest;
  try {
    body = (await request.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "That was not JSON.");
  }

  if (!body || typeof body.method !== "string") {
    return rpcError(body?.id, -32600, "That is not a JSON-RPC request.");
  }

  const { id, method, params } = body;

  /* A notification has no id and expects no answer. `initialized` is the
     one that actually arrives. Answering it with a result is harmless and
     answering with 202 and no body is correct, so do the correct thing. */
  if (method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  if (method === "initialize") {
    /* Answered before the token is checked, on purpose. A client that
       cannot complete a handshake reports "server unreachable", which
       sends somebody to look at DNS. Letting the handshake finish means
       the first tool call returns a sentence telling them their token is
       missing, which sends them to the right place. */
    return ok(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "abram-crm", version: "1.0.0" },
      instructions: [
        "The ABRAM CRM. People, the companies they are at, the deals on them, and everything logged against both.",
        "Everything you can read here is scoped to the signed in person's own access. An empty answer may mean a record exists and belongs to somebody else, and the tools say so when that is possible.",
        "Before drafting anything that goes out, read the brand voice with search_brain. Every product claim has to trace to something real.",
      ].join("\n\n"),
    });
  }

  if (method === "ping") return ok(id, {});

  /* Everything past here needs to know who is asking. */
  const auth = await identify(request);

  if (!auth.identity) {
    const message = failureMessage(auth.failure ?? "no_token");

    /* 401 with a WWW-Authenticate header is what the specification asks
       for and what a client shows the person as "sign in", rather than
       burying it in a tool result nobody reads. */
    return NextResponse.json(
      { jsonrpc: "2.0", id: id ?? null, error: { code: -32001, message } },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="abram-crm"' } }
    );
  }

  const { user, supabase } = auth.identity;
  const context: ToolContext = { supabase, user };

  if (method === "tools/list") {
    return ok(id, { tools: visibleTools(user) });
  }

  if (method === "tools/call") {
    const name = typeof params?.name === "string" ? params.name : "";
    const args = (params?.arguments ?? {}) as Record<string, unknown>;

    const tool = toolByName(name);

    /* An unknown name and a name they cannot use read the same, because
       the tool list they were given already had the second kind filtered
       out. Saying "that exists but not for you" here would describe the
       shape of somebody else's access. */
    if (!tool || !can(user, tool.permission)) {
      return ok(id, content(`There is no tool called ${name || "that"} available to you.`, true));
    }

    try {
      const text = await tool.run(context, args);
      return ok(id, content(text));
    } catch (error) {
      /* Logged in full, returned in summary. A stack trace in a chat
         window is noise to the reader and detail to anybody else. */
      console.error(`MCP tool ${name} threw:`, error);
      return ok(id, content(`${name} could not finish. Whoever runs this server has the detail.`, true));
    }
  }

  return rpcError(id, -32601, `This server does not implement ${method}.`);
}

/**
 * A GET is how a person checks the address in a browser, and how some
 * clients probe for a server sent event stream. There is no stream, so
 * say so in words rather than with a 404 that reads as a wrong URL.
 */
export async function GET() {
  return NextResponse.json(
    {
      name: "abram-crm",
      transport: "streamable-http, POST only",
      protocolVersion: PROTOCOL_VERSION,
      instructions:
        "Add this URL to Claude as a custom MCP server with an Authorization: Bearer header. Create the token at /admin/dashboard/team.",
    },
    { status: 200 }
  );
}
