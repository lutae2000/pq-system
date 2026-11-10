"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useEffect, useMemo, useRef, useState } from "react";

import { AutoCompleteField } from "@/components/common/AutoCompleteField";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { buildMenuTree, collectDescendantPageCodes, compareMenus, type MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { standardFieldSx } from "@/components/common/FormControls";
import { USER_PAGE_SIZE, type UserSearchParams } from "@/modules/system/user-management/api";
import type { DepartmentRecord } from "@/modules/system/departments/api";
import { MenuPermissionCard, type MenuPermissionRowLike } from "@/components/common/MenuPermissionCard";
import type { SystemMenuRecord } from "@/modules/system/menus/api";
import type { SystemRoleRecord } from "@/modules/system/roles/api";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useUserManagementCommands } from "@/modules/system/user-management/application/useUserManagementCommands";
import { useUserManagementQueries } from "@/modules/system/user-management/application/useUserManagementQueries";
import { listUserMenuPermissions, type UserMenuPermissionRecord } from "@/modules/system/user-permission-management/api";
import type { AuthUserAccount } from "@/types/user";

const emptyUser = (): AuthUserAccount => ({
  employeeNo: "",
  userName: "",
  loginId: "",
  userPassword: "",
  useYn: true,
  groupCode: "100",
  deptCode: "",
  loginDt: "",
  recentIpAddr: "",
  logoutDt: "",
  picYn: "N",
  passwordReset: false,
  passwordResetDt: "",
  wrongPasswordCount: 0,
  email: "",
  lastChngDt: "",
  lastChngUser: "",
});

const cloneUser = (user: AuthUserAccount): AuthUserAccount => ({ ...user });

const formatValue = (value: string) => (value.trim() ? value : "-");

const optionLabel = (options: Array<{ label: string; value: string }>, value: string) =>
  options.find((item) => item.value === value)?.label ?? value;

const accountStatus = (user: AuthUserAccount) => ({
  color: user.useYn ? ("success" as const) : ("default" as const),
  label: user.useYn ? "?쒖꽦" : "鍮꾪솢??,
});

const toDeptOption = (dept: DepartmentRecord) => ({
  label: dept.deptName,
  value: dept.deptCode,
});

const toRoleOption = (role: SystemRoleRecord) => ({
  label: role.roleName,
  value: role.roleCode,
});

const EMPTY_USERS: AuthUserAccount[] = [];

type PermissionRow = {
  create: boolean;
  delete: boolean;
  menuCode: string;
  menuType: string;
  read: boolean;
  update: boolean;
};

type UserManagementTab = "details" | "permissions";

const buildPermissionRows = (menus: SystemMenuRecord[], permissions: UserMenuPermissionRecord[]): PermissionRow[] => {
  const permissionByMenuCode = new Map(permissions.map((item) => [item.menuCode, item]));

  return menus
    .slice()
    .sort(compareMenus)
    .map((menu) => {
      const permission = permissionByMenuCode.get(menu.menuCode);
      return {
        create: permission?.create ?? false,
        delete: permission?.delete ?? false,
        menuCode: menu.menuCode,
        menuType: menu.menuType,
        read: permission?.read ?? false,
        update: permission?.update ?? false,
      };
    });
};

const toMenuPermissionLikeMap = (rows: PermissionRow[]) =>
  new Map<string, MenuPermissionRowLike>(
    rows.map((row) => [
      row.menuCode,
      {
        create: row.create,
        delete: row.delete,
        menuCode: row.menuCode,
        read: row.read,
        update: row.update,
      },
    ]),
  );

const findMenuNode = (nodes: MenuTreeNode[], menuCode: string): MenuTreeNode | null => {
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
};

export function UserManagementPage() {
  const { canCreate, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { showError, showInfo, showSuccess } = useAppSnackbar();
  const initialSelectionApplied = useRef(false);
  const [activeTab, setActiveTab] = useState<UserManagementTab>("details");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState<"All" | "Y" | "N">("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [searchTick, setSearchTick] = useState(0);
  const [selectedEmployeeNo, setSelectedEmployeeNo] = useState("");
  const [draftUser, setDraftUser] = useState<AuthUserAccount>(() => emptyUser());
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);

  const [expandedMenuCodes, setExpandedMenuCodes] = useState<string[]>([]);
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [baselinePermissionRows, setBaselinePermissionRows] = useState<PermissionRow[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const { resetPasswordMutation, saveMutation, savePermissionMutation } = useUserManagementCommands({
    canCreate,
    canUpdate,
    onPasswordReset: (user) => {
      setSelectedEmployeeNo(user.employeeNo);
      setDraftUser({ ...user, userPassword: "" });
      setPasswordConfirm("");
    },
    onUserSaved: (user) => {
      setSelectedEmployeeNo(user.employeeNo);
      setDraftUser({ ...user, userPassword: "" });
      setPasswordConfirm("");
    },
    showError,
    showSuccess,
  });

  const queryCriteria = useMemo<UserSearchParams>(
    () => ({ keyword: appliedKeyword, page, useYn: useYnFilter, groupCode: groupFilter, deptCode: deptFilter }),
    [appliedKeyword, deptFilter, groupFilter, page, useYnFilter],
  );
  const { departmentsQuery, menuQuery, rolesQuery, usersQuery } = useUserManagementQueries(tabQueryEnabled, queryCriteria, searchTick);

  const deptOptions = useMemo(
    () =>
      (departmentsQuery.data ?? [])
        .slice()
        .sort((left, right) => left.deptName.localeCompare(right.deptName))
        .map(toDeptOption),
    [departmentsQuery.data],
  );

  const groupOptions = useMemo(
    () =>
      (rolesQuery.data ?? [])
        .slice()
        .sort((left, right) => left.sortSeq - right.sortSeq || left.roleCode.localeCompare(right.roleCode))
        .map(toRoleOption),
    [rolesQuery.data],
  );

  const menus = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);
  const menuTree = useMemo(() => buildMenuTree(menus), [menus]);
  const expandedMenuCodeSet = useMemo(() => new Set(expandedMenuCodes), [expandedMenuCodes]);
  const permissionByMenuCode = useMemo(() => toMenuPermissionLikeMap(permissionRows), [permissionRows]);
  const baselinePermissionByMenuCode = useMemo(() => toMenuPermissionLikeMap(baselinePermissionRows), [baselinePermissionRows]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (menuTree.length > 0 && expandedMenuCodes.length === 0) {
      setExpandedMenuCodes(menuTree.map((node) => node.record.menuCode));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [expandedMenuCodes.length, menuTree]);

  const usersPage = usersQuery.data ?? { content: EMPTY_USERS, page, size: USER_PAGE_SIZE, totalElements: 0, totalPages: 0 };
  const users = usersQuery.data?.content ?? EMPTY_USERS;
  const userColumns = useMemo<GridColDef<AuthUserAccount>[]>(
    () => [
      { field: "userName", headerName: "?대쫫", width: 120, align: "center", headerAlign: "center" },
      { field: "loginId", headerName: "濡쒓렇??ID", minWidth: 130, flex: 0.9, align: "center", headerAlign: "center" },
      {
        field: "deptCode",
        headerName: "遺??,
        width: 120,
        flex: 1,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => optionLabel(deptOptions, row.deptCode),
      },
      {
        field: "groupCode",
        headerName: "洹몃９",
        width: 170,
        align: "center",
        headerAlign: "center",
        valueGetter: (_value, row) => optionLabel(groupOptions, row.groupCode),
      },
      {
        field: "useYn",
        headerName: "?곹깭",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const status = accountStatus(params.row);
          return (
            <Chip
              color={status.color}
              label={status.label}
              size="small"
              variant={status.color === "default" ? "outlined" : "filled"}
            />
          );
        },
      },
      {
        field: "loginDt",
        headerName: "理쒓렐 濡쒓렇??,
        minWidth: 170,
        flex: 0.8,
        align: "center",
        headerAlign: "center",
        valueFormatter: (value) => formatValue(typeof value === "string" ? value : ""),
      },
    ],
    [deptOptions, groupOptions],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.employeeNo === selectedEmployeeNo) ?? null,
    [selectedEmployeeNo, users],
  );
  const selectedRowModel = useMemo(
    () => ({ type: "include" as const, ids: new Set(selectedEmployeeNo ? [selectedEmployeeNo] : []) }),
    [selectedEmployeeNo],
  );
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page, pageSize: USER_PAGE_SIZE }),
    [page],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (usersQuery.isLoading || usersQuery.isFetching) {
      return;
    }

    if (users.length === 0) {
      setSelectedEmployeeNo("");
      setDraftUser((current) => (current.employeeNo ? emptyUser() : current));
      setPasswordConfirm("");
      setPermissionRows([]);
      setBaselinePermissionRows([]);
      return;
    }

    if (!initialSelectionApplied.current) {
      initialSelectionApplied.current = true;
      setSelectedEmployeeNo(users[0].employeeNo);
      setDraftUser({ ...cloneUser(users[0]), userPassword: "" });
      setPasswordConfirm("");
      return;
    }

    if (selectedEmployeeNo && !users.some((user) => user.employeeNo === selectedEmployeeNo)) {
      setSelectedEmployeeNo(users[0].employeeNo);
      setDraftUser({ ...cloneUser(users[0]), userPassword: "" });
      setPasswordConfirm("");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedEmployeeNo, users, usersQuery.isFetching, usersQuery.isLoading]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const loginId = selectedUser?.loginId?.trim();

    if (!loginId || menus.length === 0) {
      setPermissionRows([]);
      setBaselinePermissionRows([]);
      setPermissionLoading(false);
      return;
    }

    let active = true;
    setPermissionLoading(true);

    void listUserMenuPermissions(loginId)
      .then((permissions) => {
        if (!active) {
          return;
        }

        const rows = buildPermissionRows(menus, permissions);
        setPermissionRows(rows);
        setBaselinePermissionRows(rows);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setPermissionRows(buildPermissionRows(menus, []));
        setBaselinePermissionRows(buildPermissionRows(menus, []));
        showError(error instanceof Error ? error.message : "?ъ슜??沅뚰븳 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??");
      })
      .finally(() => {
        if (active) {
          setPermissionLoading(false);
        }
      });

    return () => {
      active = false;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [menus, selectedUser?.loginId, showError]);

  const updateDraft = <K extends keyof AuthUserAccount>(key: K, value: AuthUserAccount[K]) => {
    setDraftUser((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (user: AuthUserAccount) => {
    setSelectedEmployeeNo(user.employeeNo);
    setDraftUser({ ...cloneUser(user), userPassword: "" });
    setPasswordConfirm("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const handleNewUser = () => {
    setSelectedEmployeeNo("");
    setDraftUser(emptyUser());
    setPasswordConfirm("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setActiveTab("details");
    showInfo("??怨꾩젙 ?깅줉 紐⑤뱶濡??꾪솚?덉뒿?덈떎.");
  };



  const handleSaveUser = () => {
    if ((draftUser.userPassword || passwordConfirm) && draftUser.userPassword !== passwordConfirm) {
      showError("鍮꾨?踰덊샇? 鍮꾨?踰덊샇 ?뺤씤???쇱튂?섏? ?딆뒿?덈떎.");
      return;
    }
    saveMutation.mutate(draftUser);
  };

  const handleResetPassword = () => {
    if (!selectedUser) {
      showError("鍮꾨?踰덊샇瑜?珥덇린?뷀븷 ?ъ슜?먮? 癒쇱? ?좏깮?섏꽭??");
      return;
    }

    setResetPasswordConfirmOpen(true);
  };

  const confirmResetPassword = () => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate(selectedUser.employeeNo, {
      onSettled: () => setResetPasswordConfirmOpen(false),
    });
  };

  const selectedStatus = accountStatus(selectedUser ?? draftUser);

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

  const applyPermissionFieldState = (
    menuCodes: string[],
    field: "read" | "create" | "update" | "delete",
    checked: boolean,
  ) => {
    setPermissionRows((current) =>
      current.map((row) => (menuCodes.includes(row.menuCode) ? { ...row, [field]: checked } : row)),
    );
  };

  const applyAllPermissionState = (menuCodes: string[], checked: boolean) => {
    setPermissionRows((current) =>
      current.map((row) =>
        menuCodes.includes(row.menuCode)
          ? { ...row, create: checked, delete: checked, read: checked, update: checked }
          : row,
      ),
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

  const handleSavePermissions = async (_changedItems: MenuPermissionRowLike[]) => {
    void _changedItems;

    if (!selectedUser) {
      showError("癒쇱? 沅뚰븳????ν븷 ?ъ슜?먮? ?좏깮?섏꽭??");
      return;
    }

    const loginId = selectedUser.loginId.trim();
    if (!loginId) {
      showError("濡쒓렇??ID媛 ?녿뒗 ?ъ슜?먮뒗 沅뚰븳????ν븷 ???놁뒿?덈떎.");
      return;
    }

    setPermissionSaving(true);
    try {
      const savedPermissions = await savePermissionMutation.mutateAsync({
        loginId,
        items: permissionRows.map((row) => ({
          menuCode: row.menuCode,
          read: row.read,
          create: row.create,
          update: row.update,
          delete: row.delete,
        })),
      });
      const rows = buildPermissionRows(menus, savedPermissions);
      setPermissionRows(rows);
      setBaselinePermissionRows(rows);
      showSuccess("?ъ슜??沅뚰븳????λ릺?덉뒿?덈떎.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "?ъ슜??沅뚰븳????ν븯吏 紐삵뻽?듬땲??");
    } finally {
      setPermissionSaving(false);
    }
  };

  const visibleTab: UserManagementTab = selectedUser ? activeTab : "details";

  if (!canRead) {
    return <Alert severity="warning">?ъ슜??議고쉶 沅뚰븳???놁뒿?덈떎.</Alert>;
  }

  return (
    <Box>
      <PageHeader title="?ъ슜??愿由? />


      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SearchPanel
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={(nextKeyword) => {
            setKeyword(nextKeyword);
            setAppliedKeyword(nextKeyword);
            setPage(0);
            setSearchTick((current) => current + 1);
          }}
          onReset={() => {
            setKeyword("");
            setAppliedKeyword("");
            setUseYnFilter("All");
            setGroupFilter("All");
            setDeptFilter("All");
            setPage(0);
            setSearchTick((current) => current + 1);
          }}
          searchDisabled={!canRead}
        >
          <AutoCompleteField mode="select"
            label="?ъ슜 ?곹깭"
            onChange={(value) => setUseYnFilter((value || "All") as "All" | "Y" | "N")}
            options={[
              { label: "?꾩껜", value: "All" },
              { label: "?쒖꽦", value: "Y" },
              { label: "鍮꾪솢??, value: "N" },
            ]}
            placeholder="?꾩껜"
            placeholderDisabled={false}
            sx={{ ...standardFieldSx, minWidth: 150 }}
            value={useYnFilter}
          />
          <AutoCompleteField mode="select" source={{ type: "role" }}
            label="洹몃９"
            includeAll allValue="All"
            onChange={(value) => setGroupFilter(value || "All")}
            placeholder="?꾩껜"
            placeholderDisabled={false}
            sx={{ ...standardFieldSx, minWidth: 170 }}
            value={groupFilter}
          />
          <AutoCompleteField mode="select"
            label="遺??
            onChange={(value) => setDeptFilter(value || "All")}
            options={[{ label: "?꾩껜", value: "All" }, ...deptOptions]}
            placeholder="?꾩껜"
            placeholderDisabled={false}
            sx={{ ...standardFieldSx, minWidth: 220 }}
            value={deptFilter}
          />
        </SearchPanel>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 7fr) minmax(0, 5fr)" },
            alignItems: "start",
          }}
        >
          <Card sx={{ minWidth: 0 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    ?ъ슜??紐⑸줉
                  </Typography>
                </Box>
                <Chip label={`珥?${usersPage.totalElements}嫄?} size="small" variant="outlined" />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <EnterpriseDataGrid<AuthUserAccount>
                columns={userColumns}
                getRowId={(row) => row.employeeNo}
                hideFooterSelectedRowCount
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: USER_PAGE_SIZE } },
                }}
                loading={usersQuery.isLoading || usersQuery.isFetching}
                onPaginationModelChange={(model) => {
                  setPage((currentPage) => (currentPage === model.page ? currentPage : model.page));
                }}
                onRowClick={(params) => handleSelect(params.row)}
                pageSizeOptions={[USER_PAGE_SIZE]}
                paginationMode="server"
                paginationModel={paginationModel}
                rowCount={usersPage.totalElements}
                rowSelectionModel={selectedRowModel}
                rows={users}
                showPageNumbers
                showToolbar={false}
                wrapperMinHeight={{ xs: 520, lg: "clamp(560px, calc(100vh - 300px), 720px)" }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                }}
              />
            </CardContent>
          </Card>

          <Box
            sx={{
              minWidth: 0,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
              p: 2,
            }}
          >
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    ?ъ슜??愿由??곸꽭
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedUser ? `${selectedUser.employeeNo} / ${selectedUser.loginId}` : "??怨꾩젙???묒꽦 以묒엯?덈떎."}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                  <Chip icon={<SecurityOutlinedIcon />} label={selectedStatus.label} color={selectedStatus.color} />
                  <Chip label={`遺??${optionLabel(deptOptions, draftUser.deptCode)}`} variant="outlined" />
                  <Chip label={`洹몃９ ${optionLabel(groupOptions, draftUser.groupCode)}`} variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Tabs
                onChange={(_, value: UserManagementTab) => setActiveTab(value)}
                value={visibleTab}
                variant="fullWidth"
                sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0.75 } }}
              >
                <Tab label="?ъ슜???곸꽭" value="details" />
                <Tab disabled={!selectedUser} label="硫붾돱 沅뚰븳" value="permissions" />
              </Tabs>

              <Box sx={{ pt: 2 }}>
                {visibleTab === "details" ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
                        <Button
                            disabled={!canUpdate || !selectedUser || resetPasswordMutation.isPending}
                            onClick={handleResetPassword}
                            startIcon={<RestartAltOutlinedIcon />}
                            variant="outlined"
                            sx={{ mr: "auto", display:"none" }}
                        >
                          鍮꾨?踰덊샇 珥덇린??                        </Button>
                        <Button disabled={!canCreate} onClick={handleNewUser} startIcon={<AddOutlinedIcon />} variant="outlined">
                          ?좉퇋
                        </Button>
                        <Button
                          disabled={saveMutation.isPending || (selectedUser ? !canUpdate : !canCreate)}
                          onClick={handleSaveUser}
                          startIcon={<SaveOutlinedIcon />}
                          variant="contained"
                        >
                          ???                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle1">
                          ?꾨줈??                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField
                            fullWidth
                            label="?щ쾲"
                            onChange={(event) => updateDraft("employeeNo", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.employeeNo}
                            disabled={Boolean(selectedUser)}
                          />
                          <TextField
                            fullWidth
                            label="?대쫫"
                            onChange={(event) => updateDraft("userName", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.userName}
                          />
                          <TextField
                            fullWidth
                            label="濡쒓렇??ID"
                            onChange={(event) => updateDraft("loginId", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.loginId}
                          />
                          <TextField
                            fullWidth
                            label="?대찓??
                            onChange={(event) => updateDraft("email", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.email}
                          />
                          <AutoCompleteField mode="select" source={{ type: "role" }}
                                            label="洹몃９"
                            onChange={(value) => updateDraft("groupCode", value)}
                            placeholder="?좏깮"
                            sx={standardFieldSx}
                            value={draftUser.groupCode}
                          />
                          <AutoCompleteField
                            label="遺??
                            mode="select"
                            onChange={(value) => updateDraft("deptCode", value)}
                            options={deptOptions}
                            placeholderDisabled={false}
                            sx={standardFieldSx}
                            value={draftUser.deptCode}
                          />
                          <Box sx={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 2 }}>
                            <FormControlLabel
                              control={<Switch checked={draftUser.useYn} onChange={(_, checked) => updateDraft("useYn", checked)} size="small" />}
                              label="?쒖꽦"
                            />
                            <FormControlLabel
                              control={
                                <Switch checked={draftUser.picYn === "Y"} onChange={(_, checked) => updateDraft("picYn", checked ? "Y" : "N")} size="small" />
                              }
                              label="?대떦??
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle1">
                          蹂댁븞
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField
                            fullWidth
                            label="鍮꾨?踰덊샇"
                            helperText={selectedUser ? "?꾩옱 鍮꾨?踰덊샇瑜??좎??섎젮硫?鍮꾩썙?먯꽭??" : "??怨꾩젙?먮뒗 鍮꾨?踰덊샇媛 ?꾩슂?⑸땲??"}
                            onChange={(event) => updateDraft("userPassword", event.target.value.replace(/\s/g, ""))}
                            size="small"
                            sx={standardFieldSx}
                            type={showPassword ? "text" : "password"}
                            value={draftUser.userPassword}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton aria-label={showPassword ? "鍮꾨?踰덊샇 ?④린湲? : "鍮꾨?踰덊샇 蹂닿린"} edge="end" onClick={() => setShowPassword((current) => !current)} size="small">
                                      {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            label="鍮꾨?踰덊샇 ?뺤씤"
                            onChange={(event) => setPasswordConfirm(event.target.value.replace(/\s/g, ""))}
                            size="small"
                            sx={standardFieldSx}
                            type={showPasswordConfirm ? "text" : "password"}
                            value={passwordConfirm}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton aria-label={showPasswordConfirm ? "鍮꾨?踰덊샇 ?뺤씤 ?④린湲? : "鍮꾨?踰덊샇 ?뺤씤 蹂닿린"} edge="end" onClick={() => setShowPasswordConfirm((current) => !current)} size="small">
                                      {showPasswordConfirm ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle1">
                          ?대젰
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField fullWidth label="理쒓렐 IP" size="small" sx={standardFieldSx} value={draftUser.recentIpAddr} disabled />
                          <TextField fullWidth label="理쒓렐 濡쒓렇?? size="small" sx={standardFieldSx} value={draftUser.loginDt} disabled />
                          <TextField fullWidth label="理쒓렐 濡쒓렇?꾩썐" size="small" sx={standardFieldSx} value={draftUser.logoutDt} disabled />
                          <TextField fullWidth label="理쒖쥌 蹂寃쎌씪" size="small" sx={standardFieldSx} value={draftUser.lastChngDt} disabled />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {selectedUser ? (
                      <>
                        <MenuPermissionCard
                          badgeLabel={`${permissionRows.length}嫄?硫붾돱`}
                          description="?ъ슜?먮퀎 硫붾돱 ?묎렐 沅뚰븳??愿由ы빀?덈떎."
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
                          saveDisabled={!selectedUser || !canUpdate || permissionLoading || permissionSaving || savePermissionMutation.isPending}
                          title="硫붾돱 沅뚰븳"
                        />
                      </>
                    ) : (
                      <Box
                        sx={{
                          border: "1px dashed",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 2,
                          py: 3,
                        }}
                      >
                        <Typography color="text.secondary" variant="body2">
                          硫붾돱 沅뚰븳???몄쭛???ъ슜?먮? 癒쇱? ?좏깮?섏꽭??
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
          </Box>
        </Box>

      </Box>
    <ConfirmActionDialog
      confirmLabel="鍮꾨?踰덊샇 珥덇린??
      loading={resetPasswordMutation.isPending}
      message="?좏깮???ъ슜?먯쓽 鍮꾨?踰덊샇瑜?珥덇린?뷀븯?쒓쿋?듬땲源?"
      onClose={() => setResetPasswordConfirmOpen(false)}
      onConfirm={confirmResetPassword}
      open={resetPasswordConfirmOpen}
      title="鍮꾨?踰덊샇 珥덇린???뺤씤"
    />
    </Box>
  );
}
