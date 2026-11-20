"use client";

import { useEffect, useState } from "react";

import {
  getAuthSessionExpiryMs,
  readAuthSessionSnapshot,
  redirectToLogin,
  writeAuthNotice,
  type AuthSession,
} from "@/lib/auth/authSession";
import { frontendIdleTimeoutMs } from "@/lib/config/timeouts";
import { logoutSession } from "@/lib/http/apiClient";

const DISPLAY_TICK_MS = 1000;
const ACTIVITY_EVENTS = ["mousedown", "click", "keydown", "touchstart"] as const;

export function useIdleLogout({ enabled, session }: { enabled: boolean; session: AuthSession | null }) {
  const accessToken = session?.accessToken;
  const expiresAtMs = session ? getAuthSessionExpiryMs(session) : Infinity;
  const idleTimeoutMinutes = session?.idleTimeoutMinutes ?? 0;
  const idleTimeoutMs = idleTimeoutMinutes > 0 && Number.isFinite(idleTimeoutMinutes)
    ? idleTimeoutMinutes * 60_000
    : frontendIdleTimeoutMs;
  const [remainingMs, setRemainingMs] = useState(idleTimeoutMs);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    let idleDeadlineMs = Date.now() + idleTimeoutMs;
    let timerId: number;
    let expired = false;

    const sync = (activity = false) => {
      if (expired) {
        return;
      }

      window.clearTimeout(timerId);
      const now = Date.now();
      const deadlineMs = Math.min(idleDeadlineMs, expiresAtMs);
      if (now >= deadlineMs) {
        expired = true;
        setRemainingMs(0);
        if (readAuthSessionSnapshot()?.accessToken === accessToken) {
          writeAuthNotice("세션이 종료되었습니다. 다시 로그인해 주세요.");
          void logoutSession();
          redirectToLogin();
        }
        return;
      }

      if (activity) {
        idleDeadlineMs = now + idleTimeoutMs;
      }

      const nextRemainingMs = Math.min(idleDeadlineMs, expiresAtMs) - now;
      setRemainingMs(nextRemainingMs);
      timerId = window.setTimeout(checkExpiry, Math.min(nextRemainingMs, DISPLAY_TICK_MS));
    };

    const checkExpiry = () => sync();
    const markActivity = () => sync(true);

    timerId = window.setTimeout(checkExpiry, 0);
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, markActivity, { passive: true });
    });
    window.addEventListener("focus", checkExpiry);
    window.addEventListener("pageshow", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      window.clearTimeout(timerId);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActivity));
      window.removeEventListener("focus", checkExpiry);
      window.removeEventListener("pageshow", checkExpiry);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, [accessToken, enabled, expiresAtMs, idleTimeoutMs]);

  return { remainingMs };
}
