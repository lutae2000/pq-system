"use client";

import { type MenuPermission } from "@/lib/auth/authSession";
import { useAuthSession } from "@/lib/auth/useAuthSession";

const EMPTY_PERMISSIONS: MenuPermission[] = [];

export function useSessionMenuPermissions() {
  return useAuthSession()?.permissions ?? EMPTY_PERMISSIONS;
}
