"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Badge,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useSyncExternalStore } from "react";
import { MenuSearchPopper, type SearchMenuItem } from "@/components/layout/MenuSearchPopper";
import { MyAccountDialog } from "@/components/layout/MyAccountDialog";
import { OpenTabs } from "@/components/layout/OpenTabs";
import { useTabNavigationGuard } from "@/components/layout/useTabNavigationGuard";
import { AUTH_SESSION_STORAGE_KEY, redirectToLogin, type AuthSession } from "@/lib/auth/authSession";
import { logoutSession } from "@/lib/http/apiClient";
import { getMenuItems, type MenuItemDto } from "@/shared/navigation/menu";

type TopHeaderProps = {
  drawerWidth: number;
  sessionRemainingMs?: number;
  noticeCount?: number;
  onNoticeClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
};

export const TOP_HEADER_HEIGHT = 48;

const formatRemainingTime = (remainingMs: number) => {
  const totalSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};

const flattenMenuItems = (items: MenuItemDto[], parents: string[] = []): SearchMenuItem[] =>
  items.flatMap((item) => {
    const nextParents = [...parents, item.label];
    const pathLabel = nextParents.join(" > ");
    const current = item.href ? [{ href: item.href, label: item.label, pathLabel }] : [];
    const children = item.children ? flattenMenuItems(item.children, nextParents) : [];
    return [...current, ...children];
  });

const parseSessionSnapshot = (value: string | null): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthSession;
    if (!parsed.sessionExpiresAt) {
      return parsed;
    }

    const expiresAt = new Date(parsed.sessionExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || Date.now() < expiresAt) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

export function TopHeader({
  drawerWidth,
  sessionRemainingMs,
  noticeCount = 0,
  onNoticeClick,
  onSidebarToggle,
  sidebarCollapsed = false,
}: TopHeaderProps) {
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: getMenuItems,
  });
  const { navigateIfAllowed } = useTabNavigationGuard();
  const sessionSnapshot = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    },
    () => null,
  );
  const session = useMemo(() => parseSessionSnapshot(sessionSnapshot), [sessionSnapshot]);
  const userDisplayName = session?.userName?.trim() || "이름";

  const searchableMenuItems = useMemo(
    () => flattenMenuItems(menuQuery.data ?? []),
    [menuQuery.data],
  );

  const handleLogout = async () => {
    await logoutSession();
    redirectToLogin("/login");
  };

  const handleNoticeClick = () => {
    if (noticeCount < 1) {
      return;
    }

    onNoticeClick?.();
  };

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.92)",
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        ml: `${drawerWidth}px`,
        transition: (theme) =>
          theme.transitions.create(["margin-left", "width"], {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeInOut,
          }),
        width: `calc(100% - ${drawerWidth}px)`,
      }}
    >
      <Toolbar
        sx={{
          alignItems: "center",
          display: "flex",
          gap: 1,
          height: TOP_HEADER_HEIGHT,
          minHeight: `${TOP_HEADER_HEIGHT}px !important`,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", flex: 1, gap: 1, minWidth: 0 }}>
          {onSidebarToggle ? (
            <Tooltip title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}>
              <IconButton
                aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                color="inherit"
                onClick={onSidebarToggle}
                size="small"
                sx={{
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                  flex: "0 0 auto",
                  height: 32,
                  p: 0,
                  width: 32,
                  "&:hover": {
                    bgcolor: "action.selected",
                  },
                }}
              >
                {sidebarCollapsed ? <MenuOutlinedIcon fontSize="small" /> : <MenuOpenOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          ) : null}
          <Box sx={{ flex: 1, minWidth: 0, ml: onSidebarToggle ? 0 : -2, pr: 0.25 }}>
            <OpenTabs />
          </Box>
        </Box>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, ml: "auto" }}>
          <MenuSearchPopper items={searchableMenuItems} loading={menuQuery.isLoading} onNavigate={navigateIfAllowed} />
          <Tooltip title="알림사항">
            <IconButton
              aria-label="알림사항"
              color="inherit"
              onClick={handleNoticeClick}
              size="small"
              sx={{
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
                height: 32,
                p: 0,
                width: 32,
              }}
            >
              <Badge badgeContent={noticeCount} color="error" invisible={noticeCount === 0}>
                <NotificationsOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          {typeof sessionRemainingMs === "number" ? (
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 999,
                display: { xs: "none", sm: "flex" },
                gap: 0.75,
                px: 1.1,
                py: 0.25,
              }}
            >
              <AccessTimeOutlinedIcon fontSize="small" color="action" />
              <Box sx={{ lineHeight: 1.1 }}>
                <Typography variant="caption" color="text.secondary">
                  세션 남은 시간
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {formatRemainingTime(sessionRemainingMs)}
                </Typography>
              </Box>
            </Box>
          ) : null}
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              gap: 0.75,
              minWidth: 0,
            }}
          >
            <IconButton aria-label="내 계정 정보" color="inherit" onClick={() => setMyAccountOpen(true)} size="small" title="내 계정 정보">
              <Avatar sx={{ bgcolor: "primary.main", height: 28, width: 28 }}>{userDisplayName.charAt(0)}</Avatar>
            </IconButton>
            <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userDisplayName}
              </Typography>
              <Button
                color="inherit"
                onClick={() => {
                  void handleLogout();
                }}
                size="small"
                startIcon={<LogoutOutlinedIcon fontSize="small" />}
                sx={{
                  alignSelf: "flex-start",
                  color: "text.secondary",
                  fontSize: 11,
                  justifyContent: "flex-start",
                  lineHeight: 1.1,
                  minHeight: 20,
                  minWidth: 0,
                  p: 0,
                  '& .MuiButton-startIcon': {
                    mr: 0.5,
                  },
                  '&:hover': {
                    bgcolor: "transparent",
                    color: "primary.main",
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>
      </Toolbar>
      <MyAccountDialog onClose={() => setMyAccountOpen(false)} open={myAccountOpen} />
    </AppBar>
  );
}
