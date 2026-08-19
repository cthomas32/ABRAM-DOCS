import Link from "next/link";
import { Handshake } from "lucide-react";
import { EmptyPanel } from "@/components/admin/Panel";

/**
 * An address that names no deal.
 *
 * Reached only when the reader can see every row, so absence here is
 * genuine absence rather than a refusal wearing its clothes.
 */
export default function DealNotFound() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Deals</span>
        </nav>
        <EmptyPanel
          title="This record is gone"
          icon={<Handshake className="w-6 h-6" />}
          action={
            <Link
              href="/admin/dashboard/deals"
              className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center"
            >
              Back to deals
            </Link>
          }
        >
          Nothing on this console deletes a record, so this address was probably mistyped.
        </EmptyPanel>
      </div>
    </div>
  );
}
