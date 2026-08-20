import { discoveryPreflight, protectedResourceDocument } from "@/lib/mcp/metadata";

/**
 * The address RFC 9728 specifies for a resource with a path, and the one
 * the 401 from /api/mcp points at by name.
 */
export const dynamic = "force-dynamic";
export const GET = protectedResourceDocument;
export const OPTIONS = discoveryPreflight;
