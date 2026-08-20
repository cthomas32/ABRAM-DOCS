import { authorizationServerDocument, discoveryPreflight } from "@/lib/mcp/metadata";

/**
 * Same document, at the path-suffixed address some clients probe first.
 * Answering costs nothing; a 404 here sends a client down the guessing
 * path that produced a blank page.
 */
export const dynamic = "force-dynamic";
export const GET = authorizationServerDocument;
export const OPTIONS = discoveryPreflight;
