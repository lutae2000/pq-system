"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs as MuiBreadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getBreadcrumbItems } from "@/shared/navigation/routeMeta";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";

export function Breadcrumbs() {
  const pathname = usePathname();
  const permissions = useSessionMenuPermissions();
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return null;
  }

  const items = getBreadcrumbItems(pathname, permissions);

  return (
    <MuiBreadcrumbs aria-label="Breadcrumb" separator={<NavigateNextIcon fontSize="small" />} sx={{ lineHeight: 1.2, mb: 1.0 }}>
      {items.map((item) =>
        item.current ? (
          <Typography color="text.primary" key={item.href ?? item.label} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {item.label}
          </Typography>
        ) : (
          <MuiLink component={Link} href={item.href ?? "#"} key={item.href ?? item.label} underline="hover" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {item.label}
          </MuiLink>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
