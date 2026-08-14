"use client";

import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import type { MenuTreeNode } from "@/lib/permissions/menuPermissionTree";

export type MenuPermissionRowLike = {
  create: boolean;
  delete: boolean;
  menuCode: string;
  read: boolean;
  update: boolean;
};

export type MenuPermissionCardProps = {
  badgeLabel: string;
  expandedMenuCodeSet: Set<string>;
  isPermissionChanged: (menuCode: string) => boolean;
  menuTree: MenuTreeNode[];
  onToggleAll: (menuCode: string, menuType: string) => void;
  onToggleCell: (menuCode: string, field: "read" | "create" | "update" | "delete", menuType: string) => void;
  onToggleExpand: (menuCode: string) => void;
  permissionByMenuCode: Map<string, MenuPermissionRowLike>;
  onSave: (items: MenuPermissionRowLike[]) => void | Promise<void>;
  saveDisabled?: boolean;
  title: string;
  description: string;
};

export function MenuPermissionCard({
  badgeLabel,
  expandedMenuCodeSet,
  isPermissionChanged,
  menuTree,
  onToggleAll,
  onToggleCell,
  onToggleExpand,
  permissionByMenuCode,
  onSave,
  saveDisabled = false,
  title,
  description,
}: MenuPermissionCardProps) {
  const changedPermissionItems = collectChangedPermissionItems(menuTree, permissionByMenuCode, isPermissionChanged);

  return (
    <Card sx={{ borderRadius: 2, minWidth: 0 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              {title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }} variant="body2">
              {badgeLabel}
            </Typography>
          </Box>
          <Button
            disabled={saveDisabled || changedPermissionItems.length === 0}
            onClick={() => {
              void onSave(changedPermissionItems);
            }}
            startIcon={<SaveOutlinedIcon />}
            type="button"
            variant="contained"
          >
            권한 저장
          </Button>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <TableContainer
          sx={{
            maxHeight: { xs: 360, md: "clamp(420px, calc(100vh - 340px), 620px)" },
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 500, tableLayout: "fixed", width: "100%" }}>
            <colgroup>
              <col style={{ width: "auto" }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 56 }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", pr: 1 }}>메뉴</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: "nowrap", px: 0.5 }}>
                  전체
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: "nowrap", px: 0.5 }}>
                  조회
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: "nowrap", px: 0.5 }}>
                  등록
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: "nowrap", px: 0.5 }}>
                  수정
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: "nowrap", px: 0.5 }}>
                  삭제
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuTree.map((root) =>
                renderMenuRows(
                  root,
                  0,
                  expandedMenuCodeSet,
                  isPermissionChanged,
                  onToggleAll,
                  onToggleCell,
                  onToggleExpand,
                  permissionByMenuCode,
                ),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

const renderMenuRows = (
  node: MenuTreeNode,
  depth: number,
  expandedMenuCodeSet: Set<string>,
  isPermissionChanged: (menuCode: string) => boolean,
  onToggleAll: (menuCode: string, menuType: string) => void,
  onToggleCell: (menuCode: string, field: "read" | "create" | "update" | "delete", menuType: string) => void,
  onToggleExpand: (menuCode: string) => void,
  permissionByMenuCode: Map<string, MenuPermissionRowLike>,
): ReactNode[] => {
  const permission = permissionByMenuCode.get(node.record.menuCode);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedMenuCodeSet.has(node.record.menuCode);
  const allChecked = Boolean(permission?.read && permission?.create && permission?.update && permission?.delete);
  const isChanged = isPermissionChanged(node.record.menuCode);

  const rows: ReactNode[] = [
    <TableRow
      key={node.record.menuCode}
      hover
      sx={{
        backgroundColor: isChanged ? "#fff7ed" : undefined,
        "&:hover": {
          backgroundColor: isChanged ? "#ffedd5" : "#f8fafc",
        },
      }}
    >
      <TableCell sx={{ py: 0.75, pr: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, pl: `${depth * 16}px` }}>
          {hasChildren ? (
            <IconButton onClick={() => onToggleExpand(node.record.menuCode)} size="small" sx={{ mr: 0.25, p: 0.5 }}>
              {isExpanded ? <ExpandMoreOutlinedIcon fontSize="inherit" /> : <ChevronRightOutlinedIcon fontSize="inherit" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24, flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }} noWrap>
              {node.record.menuName}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }} noWrap>
              {node.record.menuCode}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell align="center" padding="checkbox" sx={{ py: 0.5, whiteSpace: "nowrap", px: 0.5 }}>
        <Checkbox checked={allChecked} onChange={() => onToggleAll(node.record.menuCode, node.record.menuType)} />
      </TableCell>
      <TableCell align="center" padding="checkbox" sx={{ py: 0.5, whiteSpace: "nowrap", px: 0.5 }}>
        <Checkbox checked={permission?.read ?? false} onChange={() => onToggleCell(node.record.menuCode, "read", node.record.menuType)} />
      </TableCell>
      <TableCell align="center" padding="checkbox" sx={{ py: 0.5, whiteSpace: "nowrap", px: 0.5 }}>
        <Checkbox checked={permission?.create ?? false} onChange={() => onToggleCell(node.record.menuCode, "create", node.record.menuType)} />
      </TableCell>
      <TableCell align="center" padding="checkbox" sx={{ py: 0.5, whiteSpace: "nowrap", px: 0.5 }}>
        <Checkbox checked={permission?.update ?? false} onChange={() => onToggleCell(node.record.menuCode, "update", node.record.menuType)} />
      </TableCell>
      <TableCell align="center" padding="checkbox" sx={{ py: 0.5, whiteSpace: "nowrap", px: 0.5 }}>
        <Checkbox checked={permission?.delete ?? false} onChange={() => onToggleCell(node.record.menuCode, "delete", node.record.menuType)} />
      </TableCell>
    </TableRow>,
  ];

  if (hasChildren && isExpanded) {
    node.children.forEach((child) => {
      rows.push(
        ...renderMenuRows(
          child,
          depth + 1,
          expandedMenuCodeSet,
          isPermissionChanged,
          onToggleAll,
          onToggleCell,
          onToggleExpand,
          permissionByMenuCode,
        ),
      );
    });
  }

  return rows;
};

const collectChangedPermissionItems = (
  nodes: MenuTreeNode[],
  permissionByMenuCode: Map<string, MenuPermissionRowLike>,
  isPermissionChanged: (menuCode: string) => boolean,
): MenuPermissionRowLike[] => {
  const items: MenuPermissionRowLike[] = [];

  const visit = (node: MenuTreeNode) => {
    if (isPermissionChanged(node.record.menuCode)) {
      const permission = permissionByMenuCode.get(node.record.menuCode);
      if (permission) {
        items.push(permission);
      }
    }

    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return items;
};
