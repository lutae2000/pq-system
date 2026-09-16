"use client";

import { useMemo, useSyncExternalStore } from "react";

import { getAuthSessionStorageSnapshot, readAuthSessionSnapshot, subscribeAuthSession } from "@/lib/auth/authSession";

export function useSessionMenuPermissions() {
  const sessionSnapshot = useSyncExternalStore(subscribeAuthSession, getAuthSessionStorageSnapshot, () => "");
  return useMemo(
    () => (sessionSnapshot ? readAuthSessionSnapshot()?.permissions ?? [] : []),
    [sessionSnapshot],
  );
}
