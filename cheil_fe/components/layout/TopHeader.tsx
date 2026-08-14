"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Badge,
  InputAdornment,
  IconButton,
  Popper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { OpenTabs } from "@/components/layout/OpenTabs";
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

type SearchMenuItem = {
  href: string;
  label: string;
  pathLabel: string;
};

export const TOP_HEADER_HEIGHT = 56;

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

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
  const router = useRouter();
  const [searchAnchorEl, setSearchAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: getMenuItems,
  });
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

  const findBestMatch = (value: string) => {
    const query = normalize(value.trim());

    if (!query) {
      return null;
    }

    return (
      searchableMenuItems.find((item) => normalize(item.pathLabel) === query || normalize(item.label) === query) ??
      searchableMenuItems.find((item) => normalize(item.pathLabel).includes(query) || normalize(item.label).includes(query))
    );
  };

  const navigateToBestMatch = (value: string) => {
    const match = findBestMatch(value);

    if (!match) {
      return;
    }

    router.push(match.href);
    setSearchValue("");
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    navigateToBestMatch(searchValue);
  };

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

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (searchAnchorEl?.contains(target)) {
        return;
      }

      if (document.querySelector("[data-menu-search-popper]")?.contains(target)) {
        return;
      }

      setSearchOpen(false);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchAnchorEl, searchOpen]);

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
      <Toolbar sx={{ gap: 1.25, height: TOP_HEADER_HEIGHT, minHeight: TOP_HEADER_HEIGHT, display: "flex", alignItems: "center" }}>
        <Box sx={{ alignItems: "center", display: "flex", flex: 1, gap: 1.25, minWidth: 0 }}>
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
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, ml: "auto" }}>
          <Tooltip title="메뉴 검색">
            <IconButton
              aria-label="메뉴 검색"
              color="inherit"
              onClick={(event) => {
                setSearchAnchorEl(event.currentTarget);
                setSearchOpen((current) => !current);
              }}
              size="small"
              sx={{
                bgcolor: searchOpen ? "primary.main" : "action.hover",
                border: "1px solid",
                borderColor: searchOpen ? "primary.main" : "divider",
                color: searchOpen ? "primary.contrastText" : "inherit",
                "&:hover": {
                  bgcolor: searchOpen ? "primary.dark" : "action.selected",
                },
              }}
            >
              <SearchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Popper
            anchorEl={searchAnchorEl}
            data-menu-search-popper
            open={searchOpen}
            placement="bottom-end"
            sx={{ mt: 1, width: 320, zIndex: (theme) => theme.zIndex.modal }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: "0 16px 50px rgba(15, 23, 42, 0.16)",
                p: 1,
              }}
            >
              <Autocomplete<SearchMenuItem, false, false, false>
                autoHighlight
                clearOnBlur={false}
                data-testid="menu-search"
                filterOptions={(options, state) => {
                  const query = normalize(state.inputValue);
                  if (!query) {
                    return options.slice(0, 8);
                  }

                  return options
                    .filter((item) => normalize(item.pathLabel).includes(query) || normalize(item.label).includes(query))
                    .slice(0, 8);
                }}
                getOptionLabel={(option) => option.pathLabel}
                getOptionKey={(option) => `${option.href}:${option.pathLabel}`}
                inputValue={searchValue}
                loading={menuQuery.isLoading}
                noOptionsText="검색 결과가 없습니다"
                onChange={(_, selectedItem) => {
                  if (!selectedItem) {
                    return;
                  }

                  router.push(selectedItem.href);
                  setSearchValue("");
                  setSearchOpen(false);
                }}
                onInputChange={(_, nextInputValue, reason) => {
                  if (reason === "reset") {
                    return;
                  }

                  setSearchValue(nextInputValue);
                }}
                open
                options={searchableMenuItems}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  const optionKey = key ?? `${option.href}:${option.pathLabel}`;
                  return (
                    <Box key={optionKey} component="li" {...optionProps} sx={{ display: "grid", gap: 0.25, py: 0.75 }}>
                      <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>
                        {option.label}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.25 }}>
                        {option.pathLabel}
                      </Typography>
                    </Box>
                  );
                }}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      border: 0,
                      boxShadow: "none",
                      mt: 0.75,
                      "& .MuiAutocomplete-option": {
                        alignItems: "stretch",
                        minHeight: 48,
                      },
                    },
                  },
                  popper: {
                    disablePortal: true,
                    sx: { position: "static !important", transform: "none !important" },
                  },
                }}
                value={null}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    autoComplete="off"
                    aria-label="메뉴 검색"
                    onKeyDown={handleSearchKeyDown}
                    placeholder="메뉴 검색"
                    size="small"
                    slotProps={{
                      ...params.slotProps,
                      htmlInput: {
                        ...params.slotProps?.htmlInput,
                        autoComplete: "off",
                      },
                      input: {
                        ...params.slotProps?.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchOutlinedIcon fontSize="small" />
                            </InputAdornment>
                            {params.slotProps?.input?.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Box>
          </Popper>
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
                gap: 1,
                px: 1.4,
                py: 0.45,
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
              gap: 1,
              minWidth: 0,
            }}
          >
            <Avatar sx={{ bgcolor: "primary.main", height: 32, width: 32 }}>{userDisplayName.charAt(0)}</Avatar>
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
    </AppBar>
  );
}
