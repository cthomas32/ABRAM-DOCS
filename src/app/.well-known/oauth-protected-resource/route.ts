import { discoveryPreflight, protectedResourceDocument } from "@/lib/mcp/metadata";

/** The bare form, for a client that tries it before the specified one. */
export const dynamic = "force-dynamic";
export const GET = protectedResourceDocument;
export const OPTIONS = discoveryPreflight;
