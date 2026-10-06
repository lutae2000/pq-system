"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { memo, useMemo, useState, type ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TabActivityProvider } from "@/components/layout/TabActivityContext";
import { pageRegistry } from "@/shared/navigation/pageRegistry.generated";
import { useLayoutStore } from "@/store/layoutStore";

const PersistentTabPanel = memo(function PersistentTabPanel({ active, href }: { active: boolean; href: string }) {
  const RegisteredPage = pageRegistry[href as keyof typeof pageRegistry];

  if (!RegisteredPage) {
    return null;
  }

  return (
    <Box
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
          <RegisteredPage />
        </TabActivityProvider>
      </Box>
    </Box>
  );
});

export function TabFrameOutlet({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabs = useLayoutStore((state) => state.tabs);
  const [visitedHrefs, setVisitedHrefs] = useState(() => new Set([pathname]));

  if (!visitedHrefs.has(pathname)) {
    setVisitedHrefs((current) => new Set(current).add(pathname));
  }

  const tabHrefs = useMemo(
    () => Array.from(new Set([...tabs.map((tab) => tab.href), pathname])).filter((href) => href !== "/login"),
    [pathname, tabs],
  );

  return (
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
      {tabHrefs.map((href) => {
        const active = href === pathname;
        const RegisteredPage = pageRegistry[href as keyof typeof pageRegistry];
        const visited = active || visitedHrefs.has(href);

        if (RegisteredPage && visited) {
          return <PersistentTabPanel active={active} href={href} key={href} />;
        }

        if (!active) {
          return null;
        }

        return (
          <Box
            key={href}
            sx={{ height: "100%", minHeight: 0, minWidth: 0, position: "relative" }}
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
                <Breadcrumbs />
                {children}
              </TabActivityProvider>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
