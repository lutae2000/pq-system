"use client";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  CircularProgress,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { menuIconMap } from "@/components/layout/navigation";
import { useTabNavigationGuard } from "@/components/layout/useTabNavigationGuard";
import { getMenuItems, type MenuItemDto } from "@/shared/navigation/menu";

const emptyMenuItems: MenuItemDto[] = [];

type SidebarProps = {
  drawerWidth: number;
};

function matchesMenuPath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchesExactMenuPath(pathname: string, href?: string) {
  return Boolean(href) && pathname === href;
}

function hasActiveChild(item: MenuItemDto, pathname: string) {
  return item.children?.some((child) => matchesMenuPath(pathname, child.href)) ?? false;
}

export function Sidebar({ drawerWidth }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { guardTabNavigation } = useTabNavigationGuard();
  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: getMenuItems,
  });

  const menuItems = menuQuery.data ?? emptyMenuItems;
  const activeGroupIds = useMemo(
    () =>
      menuItems
        .filter((item) => hasActiveChild(item, pathname))
        .map((item) => item.id),
    [menuItems, pathname],
  );

  const isGroupOpen = (item: MenuItemDto) => openGroups[item.id] ?? activeGroupIds.includes(item.id);

  const renderItem = (item: MenuItemDto, depth = 0) => {
    const Icon = menuIconMap[item.icon] ?? SettingsOutlinedIcon;
    const hasChildren = Boolean(item.children?.length);
    const routeAvailable = item.routeAvailable !== false;
    const selected = hasChildren
      ? (item.href ? matchesExactMenuPath(pathname, item.href) : false) || hasActiveChild(item, pathname)
      : matchesExactMenuPath(pathname, item.href);
    const open = isGroupOpen(item);

    if (hasChildren) {
      return (
        <Box key={item.id}>
          <ListItemButton
            onClick={() => setOpenGroups((current) => ({ ...current, [item.id]: !open }))}
            selected={selected}
            sx={{
              borderRadius: 1,
              mb: 0.75,
              pl: 2 + depth * 2,
              py: 1.25,
              "&.Mui-selected": {
                bgcolor: "rgba(37, 99, 235, 0.08)",
                color: "primary.main",
                "& .MuiListItemIcon-root": { color: "primary.main" },
              },
              "&:hover": {
                bgcolor: "rgba(37, 99, 235, 0.06)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: selected ? 800 : 600 }}>
                  {item.label}
                </Typography>
              }
            />
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </ListItemButton>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding>{item.children?.map((child) => renderItem(child, depth + 1))}</List>
          </Collapse>
        </Box>
      );
    }

    const listItemContent = (
      <Box sx={{ alignItems: "center", display: "flex", minWidth: 0, width: "100%" }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Icon fontSize="small" />
          </ListItemIcon>
        <ListItemText
          primary={
              <Typography variant="body2" sx={{ fontWeight: selected ? 800 : 600 }}>
              {item.label}
            </Typography>
          }
        />
        {!routeAvailable ? <WarningAmberOutlinedIcon color="warning" fontSize="small" /> : null}
      </Box>
    );

    const listItem = (
      <ListItemButton
        {...(item.href && routeAvailable ? { LinkComponent: Link, href: item.href } : {})}
        disabled={!routeAvailable || !item.href}
        onClick={(event) => {
          if (!item.href || !routeAvailable) {
            return;
          }

          guardTabNavigation(item.href, event);
        }}
        selected={selected}
        sx={{
          borderRadius: 1,
          mb: 0.75,
          pl: 2 + depth * 2,
          py: 1.25,
          "&.Mui-selected": {
            bgcolor: "primary.main",
            boxShadow: "0 8px 20px rgba(37, 99, 235, 0.20)",
            color: "primary.contrastText",
            "& .MuiListItemIcon-root": { color: "primary.contrastText" },
          },
          "&:hover": {
            bgcolor: selected ? "primary.main" : "rgba(37, 99, 235, 0.06)",
          },
        }}
      >
        {listItemContent}
      </ListItemButton>
    );

    if (!routeAvailable) {
      return (
        <Tooltip key={item.id} title="등록된 화면 경로가 없어 이동할 수 없습니다. system_menus.menuPath를 확인하세요." placement="right">
          <Box component="span" sx={{ display: "block" }}>
            {listItem}
          </Box>
        </Tooltip>
      );
    }

    return (
      <Box key={item.id} sx={{ display: "block" }}>
        {listItem}
      </Box>
    );
  };

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          px: 3,
          pb: 2,
          pt: 1,
        }}
      >
        <Box
          component="img"
          alt="Cheil"
          src="/branding/logo_white_landscape.png"
          sx={{
            display: "block",
            height: 33,
            objectFit: "contain",
            width: 230,
          }}
        />
      </Box>
      <List sx={{ px: 1.5, py: 2 }}>
        {menuQuery.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          menuItems.map((item) => renderItem(item))
        )}
      </List>
    </Box>
  );

  return (
    <Drawer
      open
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      {content}
    </Drawer>
  );
}
