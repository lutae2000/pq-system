"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmActionDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { standardFieldSx } from "@/components/common/FormControls";
import { buildMenuTree, type MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import {
  createSystemMenu,
  deleteSystemMenu,
  getSystemMenu,
  listSystemMenus,
  type SystemMenuRecord,
  updateSystemMenu,
} from "./api";
import {AuditFields} from "@/components/common/AuditFields";

type MenuFilters = {
  keyword: string;
};

type MenuFormState = {
  description: string;
  menuCode: string;
  menuName: string;
  menuPath: string;
  menuType: string;
  parentMenuCode: string;
  sortSeq: string;
  useYn: boolean;
  visibleYn: boolean;
};

const initialFilters: MenuFilters = {
  keyword: "",
};

const defaultForm = (parentMenuCode = ""): MenuFormState => ({
  description: "",
  menuCode: "",
  menuName: "",
  menuPath: "",
  menuType: "PAGE",
  parentMenuCode,
  sortSeq: "0",
  useYn: true,
  visibleYn: true,
});

const toFormState = (record: SystemMenuRecord): MenuFormState => ({
  description: record.description ?? "",
  menuCode: record.menuCode,
  menuName: record.menuName,
  menuPath: record.menuPath ?? "",
  menuType: record.menuType,
  parentMenuCode: record.parentMenuCode ?? "",
  sortSeq: String(record.sortSeq ?? 0),
  useYn: record.useYn,
  visibleYn: record.visibleYn,
});

const compareByCodeAndSort = (left: SystemMenuRecord, right: SystemMenuRecord) => {
  if (left.sortSeq !== right.sortSeq) {
    return left.sortSeq - right.sortSeq;
  }

  return left.menuCode.localeCompare(right.menuCode);
};

const formatMenuTypeLabel = (menuType: string) => {
  switch (menuType) {
    case "GROUP":
      return "그룹";
    case "PAGE":
      return "화면";
    case "ACTION":
      return "동작";
    default:
      return menuType;
  }
};

const buildParentMap = (records: SystemMenuRecord[]) =>
  new Map(
    records.map((record) => [
      record.menuCode,
      record.parentMenuCode?.trim() && record.parentMenuCode !== record.menuCode ? record.parentMenuCode : null,
    ]),
  );

const collectAncestors = (menuCode: string | null, parentMap: Map<string, string | null>) => {
  if (!menuCode) {
    return [] as string[];
  }

  const codes: string[] = [];
  const seen = new Set<string>();
  let cursor = parentMap.get(menuCode) ?? null;

  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    codes.push(cursor);
    cursor = parentMap.get(cursor) ?? null;
  }

  return codes;
};

export function MenuManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const [filters, setFilters] = useState<MenuFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MenuFilters>(initialFilters);
  const [records, setRecords] = useState<SystemMenuRecord[]>([]);
  const [selectedMenuCode, setSelectedMenuCode] = useState<string | null>(null);
  const [expandedMenuCodes, setExpandedMenuCodes] = useState<string[]>([]);
  const [draft, setDraft] = useState<MenuFormState>(() => defaultForm());
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "info" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemMenuRecord | null>(null);

  const selectedMenu = useMemo(
    () => records.find((item) => item.menuCode === selectedMenuCode) ?? null,
    [records, selectedMenuCode],
  );

  const menuTree = useMemo(() => buildMenuTree(records), [records]);
  const parentMap = useMemo(() => buildParentMap(records), [records]);
  const rootMenuCodes = useMemo(() => menuTree.map((node) => node.record.menuCode), [menuTree]);
  const selectedAncestors = useMemo(() => collectAncestors(selectedMenuCode, parentMap), [parentMap, selectedMenuCode]);
  const expandedMenuCodeSet = useMemo(
    () => new Set([...rootMenuCodes, ...expandedMenuCodes, ...selectedAncestors]),
    [expandedMenuCodes, rootMenuCodes, selectedAncestors],
  );
  const canSaveCurrent = isCreating ? canCreate : canUpdate;

  const loadMenus = useCallback(async (keyword: string, preferredMenuCode?: string | null) => {
    setLoading(true);
    try {
      const data = await listSystemMenus();
      const filtered = keyword.trim()
        ? data.filter(
            (item) =>
              item.menuCode.includes(keyword.trim()) ||
              item.menuName.includes(keyword.trim()) ||
              (item.menuPath ?? "").includes(keyword.trim()),
          )
        : data;
      const sorted = [...filtered].sort(compareByCodeAndSort);
      setRecords(sorted);

      const nextSelected = preferredMenuCode ? sorted.find((item) => item.menuCode === preferredMenuCode) : sorted[0];
      if (nextSelected) {
        setSelectedMenuCode(nextSelected.menuCode);
        setDraft(toFormState(nextSelected));
        setIsCreating(false);
      } else {
        setSelectedMenuCode(null);
        setDraft(defaultForm());
        setIsCreating(false);
      }
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "메뉴 목록을 불러오지 못했습니다.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMenus(appliedFilters.keyword);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [appliedFilters.keyword, loadMenus]);

  const handleSelect = async (menuCode: string) => {
    try {
      const menu = await getSystemMenu(menuCode);
      setSelectedMenuCode(menu.menuCode);
      setDraft(toFormState(menu));
      setIsCreating(false);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "메뉴 상세 정보를 불러오지 못했습니다.", severity: "error" });
    }
  };

  const handleToggleExpand = (menuCode: string) => {
    setExpandedMenuCodes((current) =>
      current.includes(menuCode) ? current.filter((code) => code !== menuCode) : [...current, menuCode],
    );
  };

  const handleSearch = (keyword: string) => {
    if (!canRead) {
      return;
    }

    const nextFilters = { ...filters, keyword };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleNewRoot = () => {
    if (!canCreate) {
      return;
    }

    setSelectedMenuCode(null);
    setDraft(defaultForm());
    setIsCreating(true);
  };

  const handleNewChild = () => {
    if (!canCreate) {
      return;
    }

    setSelectedMenuCode(null);
    setDraft(defaultForm(selectedMenu?.menuCode ?? ""));
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!canSaveCurrent) {
      setNotice({ message: "저장 권한이 없습니다.", severity: "error" });
      return;
    }

    if (!draft.menuCode.trim() || !draft.menuName.trim()) {
      setNotice({ message: "메뉴 코드와 메뉴명은 필수입니다.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const requestBody = {
        description: draft.description.trim() || null,
        menuCode: draft.menuCode.trim(),
        menuName: draft.menuName.trim(),
        menuPath: draft.menuPath.trim() || null,
        menuType: draft.menuType.trim(),
        parentMenuCode: draft.parentMenuCode.trim() || null,
        sortSeq: Number(draft.sortSeq || 0),
        useYn: draft.useYn,
        visibleYn: draft.visibleYn,
      };

      const saved = isCreating || !selectedMenuCode
        ? await createSystemMenu(requestBody)
        : await updateSystemMenu(selectedMenuCode, requestBody);
      await loadMenus(appliedFilters.keyword, saved.menuCode);
      setNotice({ message: "메뉴가 저장되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "메뉴를 저장하지 못했습니다.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    try {
      await deleteSystemMenu(deleteTarget.menuCode);
      setDeleteTarget(null);
      await loadMenus(appliedFilters.keyword, null);
      setDraft(defaultForm());
      setSelectedMenuCode(null);
      setIsCreating(false);
      setNotice({ message: "메뉴가 삭제되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "메뉴를 삭제하지 못했습니다.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const selectedPath = useMemo(() => {
    if (!selectedMenu) {
      if (isCreating && draft.parentMenuCode.trim()) {
        const parentName = records.find((item) => item.menuCode === draft.parentMenuCode)?.menuName ?? draft.parentMenuCode;
        return `${parentName} > 새 메뉴`;
      }

      return draft.menuCode.trim() ? draft.menuCode : "새 메뉴";
    }

    const labels = [...collectAncestors(selectedMenu.menuCode, parentMap)]
      .reverse()
      .map((menuCode) => records.find((item) => item.menuCode === menuCode)?.menuName ?? menuCode);
    labels.push(selectedMenu.menuName);
    return labels.join(" > ");
  }, [draft.menuCode, draft.parentMenuCode, isCreating, parentMap, records, selectedMenu]);

  const selectedBadgeLabel = selectedMenu
    ? `${selectedMenu.menuCode} · ${selectedMenu.menuType}`
    : isCreating
      ? "신규 등록"
      : "선택된 메뉴 없음";

  const renderTreeNode = (node: MenuTreeNode, depth = 0) => {
    const record = node.record;
    const hasChildren = node.children.length > 0;
    const isOpen = expandedMenuCodeSet.has(record.menuCode);
    const isSelected = record.menuCode === selectedMenuCode;

    return (
      <Box key={record.menuCode}>
        <Box
          onClick={() => void handleSelect(record.menuCode)}
          sx={{
            alignItems: "center",
            borderRadius: 1,
            cursor: "pointer",
            display: "grid",
            gap: 1,
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            px: 1.25,
            py: 0.75,
            pl: 1.25 + depth * 2,
            transition: "background-color 120ms ease",
            bgcolor: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent",
            "&:hover": {
              bgcolor: isSelected ? "rgba(37, 99, 235, 0.12)" : "action.hover",
            },
          }}
        >
          {hasChildren ? (
            <IconButton
              aria-label={isOpen ? "접기" : "펼치기"}
              onClick={(event) => {
                event.stopPropagation();
                handleToggleExpand(record.menuCode);
              }}
              size="small"
              sx={{ color: "text.secondary", p: 0.4 }}
            >
              {isOpen ? <ExpandMoreOutlinedIcon fontSize="small" /> : <ChevronRightOutlinedIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 28, flexShrink: 0 }} />
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: isSelected ? 800 : 600 }} variant="body2">
              {record.menuName}
            </Typography>
            <Typography noWrap color="text.secondary" sx={{ fontSize: 12 }}>
              {record.menuCode}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
            <Chip label={formatMenuTypeLabel(record.menuType)} size="small" variant="outlined" />
            <Chip color={record.useYn ? "success" : "default"} label={record.useYn ? "Y" : "N"} size="small" />
          </Stack>
        </Box>

        {hasChildren && isOpen ? node.children.map((child) => renderTreeNode(child, depth + 1)) : null}
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader
        title="메뉴 관리"
      />

      <SearchPanel
        keyword={filters.keyword}
        keywordLabel="메뉴 검색"
        keywordPlaceholder="메뉴명, 메뉴코드, 경로 검색"
        onKeywordChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
        onReset={handleReset}
        onSearch={handleSearch}
        searchDisabled={!canRead}
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 4.6fr) minmax(0, 7.4fr)" },
          alignItems: "start",
        }}
      >
        <Card sx={{ borderRadius: 1, minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  메뉴 트리
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
              <Button disabled={!canCreate} onClick={handleNewRoot} startIcon={<AddOutlinedIcon />} variant="outlined">
                최상위 추가
              </Button>
              <Button disabled={!canCreate} onClick={handleNewChild} startIcon={<AddOutlinedIcon />} variant="outlined">
                하위 추가
              </Button>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Box
              sx={{
                height: { xs: 360, md: "clamp(420px, calc(100vh - 360px), 560px)" },
                overflowY: "auto",
                overflowX: "hidden",
                pr: 0.5,
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : menuTree.length > 0 ? (
                <Stack spacing={0.25}>{menuTree.map((node) => renderTreeNode(node))}</Stack>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography color="text.secondary" variant="body2">
                    조회된 메뉴가 없습니다.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 1, minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  메뉴 상세
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  {selectedPath}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Chip label={selectedBadgeLabel} variant="outlined" />
                <Chip color={draft.useYn ? "success" : "default"} label={draft.useYn ? "사용" : "미사용"} />
                <Chip color={draft.visibleYn ? "primary" : "default"} label={draft.visibleYn ? "노출" : "미노출"} />
              </Stack>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end", mb: 2 }}>
{/*              <Button disabled={!canCreate} onClick={handleNewRoot} startIcon={<AddOutlinedIcon />} variant="outlined">
                신규
              </Button>*/}
              <Button disabled={saving || !canSaveCurrent} onClick={handleSave} startIcon={<SaveOutlinedIcon />} variant="contained">
                저장
              </Button>
              <Button
                color="error"
                disabled={!canDelete || saving || !selectedMenu}
                onClick={() => setDeleteTarget(selectedMenu)}
                startIcon={<DeleteOutlineOutlinedIcon />}
                variant="outlined"
              >
                삭제
              </Button>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField
                fullWidth
                label="메뉴 코드"
                onChange={(event) => setDraft((current) => ({ ...current, menuCode: event.target.value }))}
                size="small"
                sx={standardFieldSx}
                value={draft.menuCode}
                disabled={Boolean(selectedMenuCode) && !isCreating}
              />
              <TextField
                fullWidth
                label="메뉴명"
                onChange={(event) => setDraft((current) => ({ ...current, menuName: event.target.value }))}
                size="small"
                sx={standardFieldSx}
                value={draft.menuName}
              />
              <TextField
                fullWidth
                label="상위 메뉴"
                onChange={(event) => setDraft((current) => ({ ...current, parentMenuCode: event.target.value }))}
                select
                size="small"
                sx={standardFieldSx}
                value={draft.parentMenuCode}
              >
                <MenuItem value="">최상위</MenuItem>
                {records
                  .filter((option) => option.menuCode !== draft.menuCode)
                  .map((option) => (
                  <MenuItem key={option.menuCode} value={option.menuCode}>
                    {option.menuName} ({option.menuCode})
                  </MenuItem>
                  ))}
              </TextField>
              <TextField
                fullWidth
                label="메뉴 경로"
                onChange={(event) => setDraft((current) => ({ ...current, menuPath: event.target.value }))}
                size="small"
                sx={standardFieldSx}
                value={draft.menuPath}
              />
              <TextField
                fullWidth
                label="메뉴 유형"
                onChange={(event) => setDraft((current) => ({ ...current, menuType: event.target.value }))}
                select
                size="small"
                sx={standardFieldSx}
                value={draft.menuType}
              >
                <MenuItem value="GROUP">GROUP</MenuItem>
                <MenuItem value="PAGE">PAGE</MenuItem>
                <MenuItem value="ACTION">ACTION</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="정렬 순서"
                onChange={(event) => setDraft((current) => ({ ...current, sortSeq: event.target.value }))}
                size="small"
                sx={standardFieldSx}
                value={draft.sortSeq}
              />
              <TextField
                fullWidth
                label="설명"
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                size="small"
                sx={standardFieldSx}
                value={draft.description}
              />
              <Box sx={{ display: "flex", alignItems: "center", minHeight: 40, gap: 1, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.useYn}
                      onChange={(_, checked) => setDraft((current) => ({ ...current, useYn: checked }))}
                    />
                  }
                  label={draft.useYn ? "사용" : "미사용"}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.visibleYn}
                      onChange={(_, checked) => setDraft((current) => ({ ...current, visibleYn: checked }))}
                    />
                  }
                  label={draft.visibleYn ? "노출" : "미노출"}
                />
              </Box>
            </Box>

            <AuditFields

              />
          </CardContent>
        </Card>
      </Box>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
        targetLabel={deleteTarget ? `${deleteTarget.menuName} (${deleteTarget.menuCode})` : ""}
      />

      {notice ? (
        <Snackbar autoHideDuration={2500} open onClose={() => setNotice(null)}>
          <Alert severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  );
}
