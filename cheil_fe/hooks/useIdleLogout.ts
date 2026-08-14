"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { logoutSession } from "@/lib/http/apiClient";
import { readAuthSessionSnapshot, redirectToLogin } from "@/lib/auth/authSession";
import { frontendIdleTimeoutMs } from "@/lib/config/timeouts";

type UseIdleLogoutOptions = {
  enabled?: boolean;
  logoutPath?: string;
  timeoutMs?: number;
};

const DISPLAY_TICK_MS = 1000;

export function useIdleLogout({
  enabled = true,
  logoutPath = "/login",
  timeoutMs = frontendIdleTimeoutMs,
}: UseIdleLogoutOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(0);
  const loggingOutRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(timeoutMs);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

  }, []);

  const logout = useCallback(() => {
    if (loggingOutRef.current) {
      return;
    }

    loggingOutRef.current = true;
    clearTimers();
    void logoutSession();
    redirectToLogin(logoutPath);
    router.refresh();
  }, [clearTimers, logoutPath, router]);

  const getRemainingMs = useCallback(() => {
    const idleDeadlineMs = lastActivityAtRef.current + timeoutMs;
    return Math.max(idleDeadlineMs - Date.now(), 0);
  }, [timeoutMs]);

  const scheduleLogout = useCallback(
    (delayMs: number) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(logout, Math.max(delayMs, 0));
    },
    [logout],
  );

  const syncRemainingTime = useCallback(() => {
    const nextRemainingMs = getRemainingMs();
    setRemainingMs(nextRemainingMs);
    scheduleLogout(nextRemainingMs);
    return nextRemainingMs;
  }, [getRemainingMs, scheduleLogout]);

  const markActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    setRemainingMs(timeoutMs);
    scheduleLogout(timeoutMs);
    return timeoutMs;
  }, [scheduleLogout, timeoutMs]);

  useEffect(() => {
    if (!enabled || pathname === logoutPath) {
      clearTimers();
      loggingOutRef.current = false;
      return;
    }

    const session = readAuthSessionSnapshot();
    if (!session) {
      logout();
      return;
    }

    loggingOutRef.current = false;
    lastActivityAtRef.current = Date.now();
    scheduleLogout(timeoutMs);

    const activityEvents = ["mousedown", "click", "keydown", "touchstart"] as const;
    const syncEvents = ["focus", "visibilitychange"] as const;

    intervalRef.current = window.setInterval(() => {
      const nextRemainingMs = getRemainingMs();
      setRemainingMs(nextRemainingMs);
      if (nextRemainingMs <= 0) {
        logout();
      }
    }, DISPLAY_TICK_MS);

    const initialSyncTimer = window.setTimeout(() => {
      const initialRemainingMs = syncRemainingTime();
      if (initialRemainingMs <= 0) {
        logout();
      }
    }, 0);

    const handleActivity = () => {
      const nextRemainingMs = markActivity();
      if (nextRemainingMs <= 0) {
        logout();
      }
    };

    const handleSync = () => {
      const nextRemainingMs = syncRemainingTime();
      if (nextRemainingMs <= 0) {
        logout();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    syncEvents.forEach((eventName) => {
      if (eventName === "visibilitychange") {
        document.addEventListener(eventName, handleSync);
        return;
      }
      window.addEventListener(eventName, handleSync);
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      syncEvents.forEach((eventName) => {
        if (eventName === "visibilitychange") {
          document.removeEventListener(eventName, handleSync);
          return;
        }
        window.removeEventListener(eventName, handleSync);
      });
      window.clearTimeout(initialSyncTimer);
      clearTimers();
    };
  }, [clearTimers, enabled, getRemainingMs, logout, markActivity, pathname, scheduleLogout, syncRemainingTime, logoutPath, timeoutMs]);

  return { remainingMs };
}
