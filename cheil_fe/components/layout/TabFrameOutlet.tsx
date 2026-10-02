"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TabActivityProvider } from "@/components/layout/TabActivityContext";
import { useLayoutStore } from "@/store/layoutStore";

const DASHBOARD_HREF = "/dashboard";

function CachedTabContent({ active, page }: { active: boolean; page: ReactNode }) {
  const [cachedPage, setCachedPage] = useState<ReactNode>(page);

  if (active && cachedPage !== page) {
    setCachedPage(page);
  }

  return active ? page : cachedPage;
}

export function TabFrameOutlet({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabs = useLayoutStore((state) => state.tabs);

  const tabHrefs = useMemo(
    () => Array.from(new Set([...tabs.map((tab) => tab.href), pathname])).filter((href) => href !== "/login"),
    [pathname, tabs],
  );

  return (
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
      {tabHrefs.map((href) => {
        const active = href === pathname;
        const shouldUnmountWhenInactive = href === DASHBOARD_HREF || href.startsWith(`${DASHBOARD_HREF}/`);

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
                {active || !shouldUnmountWhenInactive ? <CachedTabContent active={active} page={active ? children : null} /> : null}
              </TabActivityProvider>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
