"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TabActivityProvider } from "@/components/layout/TabActivityContext";
import { pageRegistry } from "@/shared/navigation/pageRegistry.generated";
import { useLayoutStore } from "@/store/layoutStore";

const pageCache = new Map<string, ReactNode>();
const DASHBOARD_HREF = "/dashboard";

export function TabFrameOutlet({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabs = useLayoutStore((state) => state.tabs);

  const tabHrefs = useMemo(
    () => Array.from(new Set([...tabs.map((tab) => tab.href), pathname])).filter((href) => href !== "/login"),
    [pathname, tabs],
  );

  const activePathname = pathname === "/login" ? "" : pathname;
  useEffect(() => {
    const openHrefSet = new Set(tabHrefs);

    if (activePathname && !pageCache.has(activePathname)) {
      const RegisteredPage = pageRegistry[activePathname as keyof typeof pageRegistry];
      pageCache.set(activePathname, RegisteredPage ? <RegisteredPage /> : children);
    }

    for (const cachedHref of pageCache.keys()) {
      if (!openHrefSet.has(cachedHref)) {
        pageCache.delete(cachedHref);
      }
    }
  }, [activePathname, children, tabHrefs]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
      {tabHrefs.map((href) => {
        const active = href === pathname;
        const shouldUnmountWhenInactive = href === DASHBOARD_HREF || href.startsWith(`${DASHBOARD_HREF}/`);
        const page =
          pageCache.get(href) ??
          (active ? (() => {
            const RegisteredPage = pageRegistry[href as keyof typeof pageRegistry];
            return RegisteredPage ? <RegisteredPage /> : children;
          })() : null);

        return (
          <Box
            key={href}
            aria-hidden={!active}
            sx={
              active
                ? { height: "100%", minHeight: 0, minWidth: 0, position: "relative" }
                : {
                    height: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    visibility: "hidden",
                  }
            }
          >
            <Box
              sx={{
                bgcolor: "background.default",
                height: "100%",
                minHeight: 0,
                minWidth: 0,
                overflow: "auto",
                px: { xs: 2, md: 3 },
                pb: 2,
                pt: 2,
              }}
            >
              <TabActivityProvider active={active}>
                {active ? <Breadcrumbs /> : null}
                {active || !shouldUnmountWhenInactive ? page : null}
              </TabActivityProvider>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
