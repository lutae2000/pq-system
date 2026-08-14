"use client";

import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Box, Button, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, type WheelEvent as ReactWheelEvent } from "react";
import { getPageLabel } from "@/shared/navigation/routeMeta";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";
import { useLayoutStore } from "@/store/layoutStore";

export function OpenTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const tabsRailRef = useRef<HTMLDivElement | null>(null);
  const tabs = useLayoutStore((state) => state.tabs);
  const openTab = useLayoutStore((state) => state.openTab);
  const closeTab = useLayoutStore((state) => state.closeTab);
  const closeAllTabs = useLayoutStore((state) => state.closeAllTabs);
  const permissions = useSessionMenuPermissions();

  useEffect(() => {
    void useLayoutStore.persist.rehydrate();
  }, []);

  const currentTab = useMemo(
    () => ({ closable: pathname !== "/dashboard", href: pathname, label: getPageLabel(pathname, permissions) }),
    [pathname, permissions],
  );

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    openTab(currentTab);
  }, [currentTab, openTab, pathname]);

  const activeTabHref = tabs.some((tab) => tab.href === pathname) ? pathname : false;
  const canCloseAll = tabs.length > 1;

  const handleCloseTab = (href: string) => {
    const activeIndex = tabs.findIndex((tab) => tab.href === href);
    const isActive = pathname === href;
    const fallbackHref = tabs[activeIndex - 1]?.href ?? tabs[activeIndex + 1]?.href ?? "/dashboard";

    closeTab(href);

    if (isActive) {
      router.push(fallbackHref);
    }
  };

  const handleCloseAll = () => {
    closeAllTabs();

    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  };

  const handleTabsWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const scroller = tabsRailRef.current?.querySelector<HTMLElement>(".MuiTabs-scroller");

    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) {
      return;
    }

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (delta === 0) {
      return;
    }

    event.preventDefault();
    scroller.scrollLeft += delta;
  };

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, minWidth: 0, width: "100%" }}>
      <Box
        ref={tabsRailRef}
        onWheel={handleTabsWheel}
        sx={{
          alignItems: "center",
          bgcolor: "action.hover",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 999,
          display: "flex",
          flex: 1,
          minWidth: 0,
          pl: 0.5,
          pr: 0.75,
          py: 0.5,
        }}
      >
        <Tabs
          allowScrollButtonsMobile
          scrollButtons="auto"
          value={activeTabHref}
          variant="scrollable"
          sx={{
            flex: 1,
            minHeight: 32,
            minWidth: 0,
            position: "relative",
            "& .MuiTabs-flexContainer": {
              gap: 0.5,
            },
            "& .MuiTabs-indicator": {
              bottom: 2,
              height: 30,
              borderRadius: 999,
              transition:
                "left 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: 0,
              background:
                "linear-gradient(135deg, rgba(228, 241, 255, 0.70) 0%, rgba(255, 255, 255, 0.30) 42%, rgba(172, 214, 255, 0.34) 100%)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(150, 196, 255, 0.54)",
              boxShadow:
                "inset 0 1px 0 rgba(255, 255, 255, 0.50), inset 0 -1px 0 rgba(255, 255, 255, 0.14)",
            },
            "& .MuiTabs-scroller": {
              minWidth: 0,
            },
            "& .MuiTab-root": {
              minHeight: 32,
              minWidth: "auto",
              px: 1.25,
              py: 0.45,
              borderRadius: 999,
              textTransform: "none",
              transition: "all 120ms ease",
              position: "relative",
              zIndex: 1,
              "&:hover": {
                bgcolor: "action.selected",
              },
            },
            "& .MuiTab-root.Mui-selected": {
              background:
                "linear-gradient(180deg, rgba(224, 239, 255, 0.74) 0%, rgba(255, 255, 255, 0.42) 100%)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(150, 196, 255, 0.58)",
              color: "text.primary",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.68), inset 0 -1px 0 rgba(255, 255, 255, 0.12)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 1,
                borderRadius: "inherit",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.30), rgba(214, 235, 255, 0.06))",
                pointerEvents: "none",
              },
            },
            "& .MuiTab-root.Mui-selected:hover": {
              background:
                "linear-gradient(180deg, rgba(231, 243, 255, 0.78) 0%, rgba(255, 255, 255, 0.45) 100%)",
            },
          }}
        >
          {tabs.map((tab) => {
            const selected = tab.href === pathname;
            const isDashboardTab = tab.href === "/dashboard";

            return (
              <Tab
                disableRipple
                key={tab.href}
                label={
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 13,
                        fontWeight: selected ? 800 : 600,
                        maxWidth: isDashboardTab ? 140 : 160,
                        ml: isDashboardTab ? -0.5 : 0,
                      }}
                    >
                      {tab.label}
                    </Typography>
                    {tab.closable ? (
                      <Box
                        aria-label={`${tab.label} 탭 닫기`}
                        component="span"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCloseTab(tab.href);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }

                          event.preventDefault();
                          event.stopPropagation();
                          handleCloseTab(tab.href);
                        }}
                        role="button"
                        tabIndex={0}
                        sx={{
                          alignItems: "center",
                          borderRadius: "999px",
                          color: selected ? "inherit" : "text.secondary",
                          cursor: "pointer",
                          flexShrink: 0,
                          opacity: 0.9,
                          display: "inline-flex",
                          p: 0.25,
                          transition: "all 120ms ease",
                          "&:hover": {
                            bgcolor: "error.main",
                            color: "error.contrastText",
                            opacity: 1,
                          },
                        }}
                      >
                        <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                      </Box>
                    ) : null}
                  </Box>
                }
                onClick={() => {
                  if (pathname !== tab.href) {
                    router.push(tab.href);
                  }
                }}
                sx={{
                  color: "text.secondary",
                  flexShrink: 0,
                  minHeight: 32,
                  pl: isDashboardTab ? 0.25 : 1.25,
                  pr: tab.closable ? 1.0 : 1.5,
                  "&.Mui-selected": {
                    color: "text.primary",
                  },
                }}
                value={tab.href}
              />
            );
          })}
        </Tabs>
      </Box>
      <Tooltip title="열린 탭 모두 닫기">
        <span>
          <Button
            disabled={!canCloseAll}
            onClick={handleCloseAll}
            startIcon={<ClearAllOutlinedIcon fontSize="small" />}
            variant="text"
            sx={{
              borderRadius: 999,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              color: "text.secondary",
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 700,
              height: 38,
              minWidth: 0,
              px: 1.8,
              whiteSpace: "nowrap",
              textTransform: "none",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "primary.main",
                color: "primary.main",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.12)",
              },
            }}
          >
            전체 닫기
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}
