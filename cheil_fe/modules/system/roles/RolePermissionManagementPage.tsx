"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { buildMenuTree, collectDescendantPageCodes, compareMenus, type MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { standardFieldSx } from "@/components/common/FormControls";
import { MenuPermissionCard, type MenuPermissionRowLike } from "@/components/common/MenuPermissionCard";
import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";

import { listSystemMenus, type SystemMenuRecord } from "@/modules/system/menus/api";
import {
  createSystemRole,
  deleteSystemRole,
  getSystemRole,
  listRoleMenuPermissions,
  listSystemRoles,
  saveRoleMenuPermissions,
  updateSystemRole,
  type RoleMenuPermissionRecord,
  type SystemRoleRecord,
  type SystemRoleUpsertRequest,
} from "./api";

type RoleFormState = {
  description: string;
  roleCode: string;
  roleName: string;
  sortSeq: string;
  useYn: boolean;
};

const defaultRoleForm = (): RoleFormState => ({
  description: "",
  roleCode: "",
  roleName: "",
  sortSeq: "0",
  useYn: true,
});

const toRoleFormState = (record: SystemRoleRecord): RoleFormState => ({
  description: record.description ?? "",
  roleCode: record.roleCode,
  roleName: record.roleName,
  sortSeq: String(record.sortSeq ?? 0),
  useYn: record.useYn,
});

const buildPermissionRows = (menus: SystemMenuRecord[], permissions: RoleMenuPermissionRecord[]) => {
  const permissionByMenu = new Map(permissions.map((item) => [item.menuCode, item]));
  return menus
    .slice()
    .sort(compareMenus)
    .map((menu) => {
      const permission = permissionByMenu.get(menu.menuCode);
      return {
        create: permission?.create ?? false,
        delete: permission?.delete ?? false,
        menuCode: menu.menuCode,
        menuName: menu.menuName,
        menuPath: menu.menuPath,
        read: permission?.read ?? false,
        update: permission?.update ?? false,
      };
    });
};

type PermissionRow = ReturnType<typeof buildPermissionRows>[number];

export function RolePermissionManagementPage() {
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const [roles, setRoles] = useState<SystemRoleRecord[]>([]);
  const [menus, setMenus] = useState<SystemMenuRecord[]>([]);
  const [expandedMenuCodes, setExpandedMenuCodes] = useState<string[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoleFormState>(() => defaultRoleForm());
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [baselinePermissionRows, setBaselinePermissionRows] = useState<PermissionRow[]>([]);
  const [roleKeyword, setRoleKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "info" | "error" } | null>(null);

  const selectedRole = useMemo(
    () => roles.find((item) => item.roleCode === selectedRoleCode) ?? null,
    [roles, selectedRoleCode],
  );
  const menuTree = useMemo(() => buildMenuTree(menus), [menus]);
  const expandedMenuCodeSet = useMemo(() => new Set(expandedMenuCodes), [expandedMenuCodes]);
  const permissionByMenuCode = useMemo(
    () => new Map(permissionRows.map((row) => [row.menuCode, row])),
    [permissionRows],
  );
  const roleSelectionModel = useMemo(
    () => ({ type: "include" as const, ids: new Set(selectedRoleCode ? [selectedRoleCode] : []) }),
    [selectedRoleCode],
  );
  const baselinePermissionByMenuCode = useMemo(
    () => new Map(baselinePermissionRows.map((row) => [row.menuCode, row])),
    [baselinePermissionRows],
  );
  const filteredRoles = useMemo(() => {
    const keyword = roleKeyword.trim().toLowerCase();
    if (!keyword) {
      return roles;
    }

    return roles.filter((role) =>
      [role.roleCode, role.roleName, role.description ?? ""].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [roleKeyword, roles]);
  const roleColumns = useMemo<GridColDef<SystemRoleRecord>[]>(
    () => [
      { field: "roleCode", headerName: "코드", width: 120 },
      { field: "roleName", headerName: "역할명", flex: 1, minWidth: 160 },
      {
        field: "description",
        headerName: "설명",
        flex: 1,
        minWidth: 200,
        valueFormatter: (value) => (typeof value === "string" ? value : ""),
      },
      { field: "sortSeq", headerName: "순서", width: 90, align: "center", headerAlign: "center" },
      {
        field: "useYn",
        headerName: "사용",
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => <Chip color={params.value ? "success" : "default"} label={params.value ? "Y" : "N"} size="small" />,
      },
    ],
    [],
  );

  function findMenuNode(nodes: MenuTreeNode[], menuCode: string): MenuTreeNode | null {
    for (const node of nodes) {
      if (node.record.menuCode === menuCode) {
        return node;
      }
      const childMatch = findMenuNode(node.children, menuCode);
      if (childMatch) {
        return childMatch;
      }
    }
    return null;
  }

  const loadRoles = useCallback(async (preferredRoleCode?: string | null) => {
    setLoading(true);
    try {
      const [roleData, menuData] = await Promise.all([listSystemRoles(), listSystemMenus()]);
      const sortedRoles = [...roleData].sort((left, right) => (left.sortSeq !== right.sortSeq ? left.sortSeq - right.sortSeq : left.roleCode.localeCompare(right.roleCode)));
      setRoles(sortedRoles);
      setMenus(menuData);
      setExpandedMenuCodes((current) => {
        if (current.length) {
          return current;
        }
        return buildMenuTree(menuData).map((node) => node.record.menuCode);
      });

      const nextSelected = preferredRoleCode
        ? sortedRoles.find((item) => item.roleCode === preferredRoleCode)
        : sortedRoles[0];
      if (nextSelected) {
        setSelectedRoleCode(nextSelected.roleCode);
        setDraft(toRoleFormState(nextSelected));
        const permissions = await listRoleMenuPermissions(nextSelected.roleCode);
        const rows = buildPermissionRows(menuData, permissions);
        setPermissionRows(rows);
        setBaselinePermissionRows(rows);
      } else {
        setSelectedRoleCode(null);
        setDraft(defaultRoleForm());
        setPermissionRows([]);
        setBaselinePermissionRows([]);
      }
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "역할 데이터를 불러오지 못했습니다.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRoles]);

  const handleSelectRole = async (roleCode: string) => {
    try {
      const [role, permissions] = await Promise.all([getSystemRole(roleCode), listRoleMenuPermissions(roleCode)]);
      const rows = buildPermissionRows(menus, permissions);
      setSelectedRoleCode(role.roleCode);
      setDraft(toRoleFormState(role));
      setPermissionRows(rows);
      setBaselinePermissionRows(rows);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "역할 정보를 불러오지 못했습니다.", severity: "error" });
    }
  };

  const handleNewRole = () => {
    setSelectedRoleCode(null);
    setDraft(defaultRoleForm());
    const rows = buildPermissionRows(menus, []);
    setPermissionRows(rows);
    setBaselinePermissionRows(rows);
  };

  const applyPermissionFieldState = (
    menuCodes: string[],
    field: "read" | "create" | "update" | "delete",
    checked: boolean,
  ) => {
    setPermissionRows((current) =>
      current.map((row) => {
        if (!menuCodes.includes(row.menuCode)) {
          return row;
        }
        return {
          ...row,
          [field]: checked,
        };
      }),
    );
  };

  const applyAllPermissionState = (menuCodes: string[], checked: boolean) => {
    setPermissionRows((current) =>
      current.map((row) => {
        if (!menuCodes.includes(row.menuCode)) {
          return row;
        }
        return {
          ...row,
          create: checked,
          delete: checked,
          read: checked,
          update: checked,
        };
      }),
    );
  };

  const handlePermissionToggle = (menuCode: string, field: "read" | "create" | "update" | "delete", menuType: string) => {
    const current = permissionByMenuCode.get(menuCode);
    const nextChecked = !(current?.[field] ?? false);
    if (menuType === "GROUP") {
      const node = findMenuNode(menuTree, menuCode);
      const targetCodes = node ? [menuCode, ...collectDescendantPageCodes(node)] : [menuCode];
      applyPermissionFieldState(targetCodes, field, nextChecked);
      return;
    }

    applyPermissionFieldState([menuCode], field, nextChecked);
  };

  const handlePermissionToggleAll = (menuCode: string, menuType: string) => {
    const current = permissionByMenuCode.get(menuCode);
    const nextChecked = !(current?.read && current?.create && current?.update && current?.delete);
    if (menuType === "GROUP") {
      const node = findMenuNode(menuTree, menuCode);
      const targetCodes = node ? [menuCode, ...collectDescendantPageCodes(node)] : [menuCode];
      applyAllPermissionState(targetCodes, nextChecked);
      return;
    }

    applyAllPermissionState([menuCode], nextChecked);
  };

  const isPermissionChanged = (menuCode: string) => {
    const current = permissionByMenuCode.get(menuCode);
    const baseline = baselinePermissionByMenuCode.get(menuCode);
    return (
      Boolean(current?.read) !== Boolean(baseline?.read) ||
      Boolean(current?.create) !== Boolean(baseline?.create) ||
      Boolean(current?.update) !== Boolean(baseline?.update) ||
      Boolean(current?.delete) !== Boolean(baseline?.delete)
    );
  };

  const handleSaveRole = async () => {
    if (!draft.roleCode.trim() || !draft.roleName.trim()) {
      setNotice({ message: "역할 코드와 역할명은 필수입니다.", severity: "error" });
      return;
    }

    setSavingRole(true);
    try {
      const requestBody: SystemRoleUpsertRequest = {
        description: draft.description.trim() || null,
        roleCode: draft.roleCode.trim(),
        roleName: draft.roleName.trim(),
        sortSeq: Number(draft.sortSeq || 0),
        useYn: draft.useYn,
      };

      const saved = selectedRoleCode ? await updateSystemRole(selectedRoleCode, requestBody) : await createSystemRole(requestBody);
      setRoles((current) => {
        const withoutCurrent = current.filter((item) => item.roleCode !== saved.roleCode);
        return [...withoutCurrent, saved].sort((left, right) => (left.sortSeq !== right.sortSeq ? left.sortSeq - right.sortSeq : left.roleCode.localeCompare(right.roleCode)));
      });
      setSelectedRoleCode(saved.roleCode);
      setDraft(toRoleFormState(saved));
      setNotice({ message: "역할 상세가 저장되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "역할 상세를 저장하지 못했습니다.", severity: "error" });
    } finally {
      setSavingRole(false);
    }
  };

  const handleSavePermissions = async (changedItems: MenuPermissionRowLike[]) => {
    if (!selectedRoleCode) {
      setNotice({ message: "먼저 역할을 저장하거나 선택하세요.", severity: "error" });
      return;
    }

    if (changedItems.length === 0) {
      setNotice({ message: "변경된 메뉴 권한이 없습니다.", severity: "info" });
      return;
    }

    setSavingPermissions(true);
    try {
      const changedBy = readAuthSessionSnapshot()?.loginId ?? "system";
      const savedPermissions = await saveRoleMenuPermissions(selectedRoleCode, {
        items: changedItems,
        lastChangedId: changedBy,
      });

      const rows = buildPermissionRows(menus, savedPermissions);
      setPermissionRows(rows);
      setBaselinePermissionRows(rows);
      setNotice({ message: "메뉴 권한이 저장되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "메뉴 권한을 저장하지 못했습니다.", severity: "error" });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoleCode) {
      return;
    }
    if (!window.confirm("역할을 삭제하시겠습니까?")) {
      return;
    }

    setSavingRole(true);
    try {
      await deleteSystemRole(selectedRoleCode);
      await loadRoles(null);
      setNotice({ message: "역할이 삭제되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "역할을 삭제하지 못했습니다.", severity: "error" });
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <Box>
      <PageHeader title="역할 권한 관리" />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 4fr) minmax(0, 8fr)" },
          alignItems: "start",
        }}
      >
        <Card sx={{ borderRadius: 2, minWidth: 0 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  역할 목록
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  총 {roles.length}건
                </Typography>
              </Box>
              <Button disabled={!canCreate} onClick={handleNewRole} startIcon={<AddOutlinedIcon />} size="small" variant="outlined">
                신규 역할
              </Button>
            </Box>

            <TextField
              fullWidth
              label="역할 검색"
              onChange={(event) => setRoleKeyword(event.target.value)}
              placeholder="코드, 역할명, 설명으로 검색"
              size="small"
              sx={{ mb: 1.5, ...standardFieldSx }}
              value={roleKeyword}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Divider sx={{ mb: 1.5 }} />

            {loading ? (
              <Box sx={{ minHeight: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <EnterpriseDataGrid<SystemRoleRecord>
                columns={roleColumns}
                getRowId={(row) => row.roleCode}
                hideFooterSelectedRowCount
                loading={loading}
                onRowClick={(params) => void handleSelectRole(params.row.roleCode)}
                rowSelectionModel={roleSelectionModel}
                rows={filteredRoles}
                sx={{
                  border: 0,
                  minHeight: 560,
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        <Stack spacing={2}>
          <Card sx={{ borderRadius: 2, minWidth: 0 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    역할 상세
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedRole ? `${selectedRole.roleCode} ${selectedRole.roleName}` : "역할을 선택하거나 새로 등록하세요."}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={handleDelete}
                    startIcon={<DeleteOutlineOutlinedIcon />}
                    variant="outlined"
                    disabled={!selectedRoleCode || savingRole || savingPermissions || !canDelete}
                  >
                    삭제
                  </Button>
                  <Button
                    onClick={handleSaveRole}
                    startIcon={<SaveOutlinedIcon />}
                    variant="contained"
                    disabled={savingRole || savingPermissions || !canUpdate}
                  >
                    저장
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                <TextField
                  fullWidth
                  label="역할 코드"
                  onChange={(event) => setDraft((current) => ({ ...current, roleCode: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.roleCode}
                  disabled={Boolean(selectedRoleCode)}
                />
                <TextField
                  fullWidth
                  label="역할명"
                  onChange={(event) => setDraft((current) => ({ ...current, roleName: event.target.value }))}
                  size="small"
                  sx={standardFieldSx}
                  value={draft.roleName}
                />
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
                <FormControlLabel
                  control={
                    <Switch checked={draft.useYn} onChange={(_, checked) => setDraft((current) => ({ ...current, useYn: checked }))} />
                  }
                  label={draft.useYn ? "사용" : "미사용"}
                />
              </Box>
            </CardContent>
          </Card>

          <MenuPermissionCard
            badgeLabel={`${permissionRows.length}건 메뉴`}
            description="그룹 행에서 체크하면 하위 페이지 권한이 함께 적용됩니다."
            expandedMenuCodeSet={expandedMenuCodeSet}
            isPermissionChanged={isPermissionChanged}
            menuTree={menuTree}
            onToggleAll={handlePermissionToggleAll}
            onToggleCell={handlePermissionToggle}
            onToggleExpand={(menuCode) =>
              setExpandedMenuCodes((current) =>
                current.includes(menuCode) ? current.filter((code) => code !== menuCode) : [...current, menuCode],
              )
            }
            permissionByMenuCode={permissionByMenuCode}
            onSave={handleSavePermissions}
            saveDisabled={!selectedRoleCode || loading || savingRole || savingPermissions}
            title="메뉴 권한"
          />
        </Stack>
      </Box>

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


