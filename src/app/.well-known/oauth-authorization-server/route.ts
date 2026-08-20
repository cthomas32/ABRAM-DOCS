import { authorizationServerDocument, discoveryPreflight } from "@/lib/mcp/metadata";

/** The issuer has no path, so this is the correct address for it. */
export const dynamic = "force-dynamic";
export const GET = authorizationServerDocument;
export const OPTIONS = discoveryPreflight;
