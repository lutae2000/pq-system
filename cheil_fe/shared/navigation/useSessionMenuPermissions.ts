"use client";

import { useEffect, useState } from "react";

import { readAuthSessionSnapshot, type MenuPermission } from "@/lib/auth/authSession";
import { useMounted } from "@/hooks/useMounted";

export function useSessionMenuPermissions() {
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setPermissions(readAuthSessionSnapshot()?.permissions ?? []);
  }, [mounted]);

  return permissions;
}
