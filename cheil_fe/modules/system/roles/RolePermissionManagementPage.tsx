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
import { useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { buildMenuTree, collectDescendantPageCodes, compareMenus, type MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { standardFieldSx } from "@/components/common/FormControls";
import { MenuPermissionCard, type MenuPermissionRowLike } from "@/components/common/MenuPermissionCard";
import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import type { SystemMenuRecord } from "@/modules/system/menus/api";
import {
  type RoleMenuPermissionRecord,
  type SystemRoleRecord,
  type SystemRoleUpsertRequest,
} from "./api";
import { useRolePermissionMutations } from "./application/useRolePermissionMutations";
import { useRolePermissionQueries } from "./application/useRolePermissionQueries";

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
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const [expandedMenuCodes, setExpandedMenuCodes] = useState<string[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<RoleFormState>(() => defaultRoleForm());
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [baselinePermissionRows, setBaselinePermissionRows] = useState<PermissionRow[]>([]);
  const [roleKeyword, setRoleKeyword] = useState("");
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "info" | "error" } | null>(null);

  const { menusQuery, permissionsQuery, rolesQuery } = useRolePermissionQueries({
    enabled: tabQueryEnabled,
    selectedRoleCode,
  });
  const roles = useMemo(
    () => [...(rolesQuery.data ?? [])].sort((left, right) => (left.sortSeq !== right.sortSeq ? left.sortSeq - right.sortSeq : left.roleCode.localeCompare(right.roleCode))),
    [rolesQuery.data],
  );
  const menus = useMemo(() => menusQuery.data ?? [], [menusQuery.data]);

  useEffect(() => {
    if (isNewRole || selectedRoleCode || roles.length === 0) {
      return;
    }
    // The initial role is selected after the server list becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleCode(roles[0].roleCode);
    setDraft(toRoleFormState(roles[0]));
  }, [isNewRole, roles, selectedRoleCode]);

  useEffect(() => {
    if (!selectedRoleCode || !permissionsQuery.data) {
      return;
    }
    const rows = buildPermissionRows(menus, permissionsQuery.data);
    // Keep the editable permission draft synchronized with the selected role.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissionRows(rows);
    setBaselinePermissionRows(rows);
  }, [menus, permissionsQuery.data, selectedRoleCode]);

  useEffect(() => {
    if (expandedMenuCodes.length === 0 && menus.length > 0) {
      // Expand the menu tree once after the menu catalog is loaded.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedMenuCodes(buildMenuTree(menus).map((node) => node.record.menuCode));
    }
  }, [expandedMenuCodes.length, menus]);

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

  const { deleteRoleMutation, savePermissionsMutation, saveRoleMutation } = useRolePermissionMutations({
    canCreate,
    canDelete,
    canUpdate,
    onDeleted: () => {
      setSelectedRoleCode(null);
      setIsNewRole(false);
      setDraft(defaultRoleForm());
      setPermissionRows([]);
      setBaselinePermissionRows([]);
      setNotice({ message: "역할이 삭제되었습니다.", severity: "success" });
    },
    onError: (error, fallbackMessage) =>
      setNotice({ message: error instanceof Error ? error.message : fallbackMessage, severity: "error" }),
    onPermissionsSaved: () => {
      setNotice({ message: "메뉴 권한이 저장되었습니다.", severity: "success" });
    },
    onRoleSaved: (saved) => {
      setIsNewRole(false);
      setSelectedRoleCode(saved.roleCode);
      setDraft(toRoleFormState(saved));
      setNotice({ message: "역할 상세가 저장되었습니다.", severity: "success" });
    },
  });

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

  const handleNewRole = () => {
    setIsNewRole(true);
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

  const handleSaveRole = () => {
    if (selectedRoleCode ? !canUpdate : !canCreate) {
      setNotice({ message: selectedRoleCode ? "역할 수정 권한이 없습니다." : "역할 등록 권한이 없습니다.", severity: "error" });
      return;
    }
    if (!draft.roleCode.trim() || !draft.roleName.trim()) {
      setNotice({ message: "역할 코드와 역할명은 필수입니다.", severity: "error" });
      return;
    }

    const requestBody: SystemRoleUpsertRequest = {
      description: draft.description.trim() || null,
      roleCode: draft.roleCode.trim(),
      roleName: draft.roleName.trim(),
      sortSeq: Number(draft.sortSeq || 0),
      useYn: draft.useYn,
    };
    saveRoleMutation.mutate({ roleCode: selectedRoleCode, request: requestBody });
  };

  const handleSavePermissions = (changedItems: MenuPermissionRowLike[]) => {
    if (!selectedRoleCode) {
      setNotice({ message: "먼저 역할을 저장하거나 선택하세요.", severity: "error" });
      return;
    }

    if (changedItems.length === 0) {
      setNotice({ message: "변경된 메뉴 권한이 없습니다.", severity: "info" });
      return;
    }

    const changedBy = readAuthSessionSnapshot()?.loginId ?? "system";
    savePermissionsMutation.mutate({
      roleCode: selectedRoleCode,
      request: { items: changedItems, lastChangedId: changedBy },
    }, {
      onSuccess: (savedPermissions) => {
        const rows = buildPermissionRows(menus, savedPermissions);
        setPermissionRows(rows);
        setBaselinePermissionRows(rows);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedRoleCode) {
      return;
    }
    setDeleteConfirmOpen(true);
  };

  if (!canRead) {
    return (
      <Box>
        <PageHeader title="역할 권한 관리" />
        <Alert severity="warning">역할 권한을 조회할 권한이 없습니다.</Alert>
      </Box>
    );
  }

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

            {rolesQuery.isLoading || menusQuery.isLoading ? (
              <Box sx={{ minHeight: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <EnterpriseDataGrid<SystemRoleRecord>
                columns={roleColumns}
                getRowId={(row) => row.roleCode}
                hideFooterSelectedRowCount
                loading={rolesQuery.isFetching || menusQuery.isFetching}
                onRowClick={(params) => {
                  setIsNewRole(false);
                  setSelectedRoleCode(params.row.roleCode);
                  setDraft(toRoleFormState(params.row));
                }}
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
                    disabled={!selectedRoleCode || deleteRoleMutation.isPending || saveRoleMutation.isPending || savePermissionsMutation.isPending || !canDelete}
                  >
                    삭제
                  </Button>
                  <Button
                    onClick={handleSaveRole}
                    startIcon={<SaveOutlinedIcon />}
                    variant="contained"
                    disabled={saveRoleMutation.isPending || savePermissionsMutation.isPending || !(isNewRole ? canCreate : canUpdate)}
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
            saveDisabled={!selectedRoleCode || permissionsQuery.isFetching || savePermissionsMutation.isPending}
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
      <ConfirmActionDialog
        confirmColor="error"
        confirmLabel="삭제"
        loading={deleteRoleMutation.isPending}
        message="선택한 역할을 삭제하시겠습니까?"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (selectedRoleCode) {
            deleteRoleMutation.mutate(selectedRoleCode, { onSuccess: () => setDeleteConfirmOpen(false) });
          }
        }}
        open={deleteConfirmOpen}
        targetLabel={selectedRoleCode ?? undefined}
        title="역할 삭제 확인"
      />
    </Box>
  );
}


