"use client";

import { Box, CircularProgress, Toolbar, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { TabFrameOutlet } from "@/components/layout/TabFrameOutlet";
import { TopHeader, TOP_HEADER_HEIGHT } from "@/components/layout/TopHeader";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { ROUTE_GUARD_ENABLED, readAuthSession, redirectToLogin, type AuthSession } from "@/lib/auth/authSession";
import { frontendIdleTimeoutMs } from "@/lib/config/timeouts";
import { NoticeLayerDialog } from "@/modules/system/notices/NoticeLayerDialog";
import { listNoticesDashboard } from "@/modules/system/notices/api";
import { findMenuPermissionByPath, getReadableMenuPermissions } from "@/shared/navigation/menuPermissionUtils";
import { useMounted } from "@/hooks/useMounted";
import { useLayoutStore } from "@/store/layoutStore";

const drawerWidth = 280;
const noticeDismissKey = "system-notice-dismiss-date";

const isPublicPath = (pathname: string) => pathname === "/" || pathname === "/login" || pathname.startsWith("/login/");

const firstReadablePath = (session: AuthSession) =>
  getReadableMenuPermissions(session.permissions)
    .filter((permission) => permission.menuPath)
    .at(0)
    ?.menuPath ?? "/dashboard";

const canAccessPath = (pathname: string, session: AuthSession) => {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }

  if (!session.permissions?.length) {
    return true;
  }

  return findMenuPermissionByPath(pathname, session.permissions)?.readYn === true;
};

const getSeoulDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const isPublicRoute = isPublicPath(pathname);
  const isNotificationManagementRoute = pathname === "/system/notifications" || pathname.startsWith("/system/notifications/");
  const shouldLoadNotices = !isPublicRoute && !isNotificationManagementRoute;
  const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [authState, dispatchAuthState] = useReducer(
    (_state: "checking" | "allowed" | "blocked", nextState: "checking" | "allowed" | "blocked") => nextState,
    ROUTE_GUARD_ENABLED && !isPublicRoute ? "checking" : "allowed",
  );
  const noticesQuery = useQuery({
    queryKey: ["system-notices"],
    queryFn: listNoticesDashboard,
    enabled: shouldLoadNotices && authState === "allowed",
  });

  const currentSession = mounted ? readAuthSession() : null;
  const sessionEnabled = mounted && !isPublicRoute && authState === "allowed" && Boolean(currentSession);
  const { remainingMs } = useIdleLogout({
    enabled: sessionEnabled,
    timeoutMs: frontendIdleTimeoutMs,
  });
  const effectiveDrawerWidth = isSidebarOpen ? drawerWidth : 0;

  const activeNotices = useMemo(() => {
    if (!shouldLoadNotices) {
      return [];
    }

    return (noticesQuery.data ?? []).filter((notice) => notice.active);
  }, [noticesQuery.data, shouldLoadNotices]);
  useEffect(() => {
    if (!ROUTE_GUARD_ENABLED || isPublicRoute) {
      dispatchAuthState("allowed");
      return;
    }

    const session = readAuthSession();
    if (!session) {
      dispatchAuthState("blocked");
      redirectToLogin("/login");
      return;
    }

    if (!canAccessPath(pathname, session)) {
      dispatchAuthState("blocked");
      router.replace(firstReadablePath(session));
      return;
    }

    dispatchAuthState("allowed");
  }, [isPublicRoute, pathname, router]);

  useEffect(() => {
    if (isPublicRoute || authState !== "allowed" || !shouldLoadNotices) {
      return;
    }

    if (activeNotices.length === 0) {
      return;
    }

    const storedDate = window.localStorage.getItem(noticeDismissKey);
    if (storedDate === getSeoulDateKey()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNoticeOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeNotices.length, authState, isPublicRoute, shouldLoadNotices]);

  const handleDismissToday = () => {
    window.localStorage.setItem(noticeDismissKey, getSeoulDateKey());
    setNoticeOpen(false);
  };

  if (ROUTE_GUARD_ENABLED && !isPublicRoute && authState === "checking") {
    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.secondary",
          gap: 2,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2">페이지를 여는 중입니다.</Typography>
      </Box>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (ROUTE_GUARD_ENABLED && authState === "blocked") {
    return null;
  }

  return (
    <Box sx={{ bgcolor: "background.default", display: "flex", height: "100vh", overflow: "hidden" }}>
      {effectiveDrawerWidth > 0 ? <Sidebar drawerWidth={effectiveDrawerWidth} /> : null}
      <TopHeader
        drawerWidth={effectiveDrawerWidth}
        noticeCount={shouldLoadNotices ? activeNotices.length : 0}
        onNoticeClick={shouldLoadNotices ? () => setNoticeOpen(true) : undefined}
        onSidebarToggle={toggleSidebar}
        sidebarCollapsed={!isSidebarOpen}
        sessionRemainingMs={sessionEnabled ? remainingMs : undefined}
      />
      <Box
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          height: "100vh",
          minWidth: 0,
          overflow: "hidden",
          p: 0,
          pt: 0,
        }}
      >
        <Toolbar sx={{ flexShrink: 0, height: TOP_HEADER_HEIGHT, minHeight: `${TOP_HEADER_HEIGHT}px !important` }} />
        <TabFrameOutlet>
          {children}
        </TabFrameOutlet>
      </Box>

      {shouldLoadNotices ? (
        <NoticeLayerDialog
          notices={activeNotices}
          onClose={() => setNoticeOpen(false)}
          onDismissToday={handleDismissToday}
          open={noticeOpen}
          showTodayHideOption
        />
      ) : null}
    </Box>
  );
}
