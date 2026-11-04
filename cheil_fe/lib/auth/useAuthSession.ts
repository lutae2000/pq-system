"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getAuthSessionStorageSnapshot,
  readAuthSessionSnapshot,
  subscribeAuthSession,
} from "@/lib/auth/authSession";

export function useAuthSession() {
  const snapshot = useSyncExternalStore(subscribeAuthSession, getAuthSessionStorageSnapshot, () => "");
  return useMemo(() => (snapshot ? readAuthSessionSnapshot() : null), [snapshot]);
}
