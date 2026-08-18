"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { rows } from "@/lib/supabase/rows";
import { permissionsFor, type ConsoleRole, type GrowthStage, type Permission } from "./permissions";

/**
 * What this browser's reader may do.
 *
 * The accounts and deals screens were each doing this inline — read
 * `admin_users`, find yourself, run `can()` — which is three copies of a
 * lookup that must not disagree. The broadcasts screen was doing none of
 * it, so a growth partner saw a Send button that the server action would
 * refuse. Both are the same missing piece.
 *
 * This is an interface convenience and nothing more. The server action
 * checks again and row level security checks underneath that; hiding a
 * control is politeness, not a lock.
 *
 * `ready` matters: before the lookup lands, every permission reads false,
 * and a screen that treats that as a refusal will flash a disabled
 * button at somebody who holds the permission.
 */
export function useConsolePermissions(): {
  ready: boolean;
  permissions: Set<Permission>;
  can: (permission: Permission) => boolean;
} {
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;

    (async () => {
      const supabase = createClient();
      const [session, memberRows] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("admin_users").select("user_id, role, growth_stage, is_active"),
      ]);

      const me = rows<{
        user_id: string;
        role: ConsoleRole;
        growth_stage: GrowthStage | null;
        is_active: boolean;
      }>(memberRows).find((person) => person.user_id === session.data.user?.id);

      if (!live) return;
      setPermissions(
        permissionsFor(
          me ? { role: me.role, growthStage: me.growth_stage, isActive: me.is_active } : null
        )
      );
      setReady(true);
    })();

    return () => {
      live = false;
    };
  }, []);

  return { ready, permissions, can: (permission) => permissions.has(permission) };
}
