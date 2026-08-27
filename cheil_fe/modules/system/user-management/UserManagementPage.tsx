"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
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
  MenuItem,
  Tab,
  Tabs,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { CommonSelectField, defineCommonSelectDataSource } from "@/components/common/CommonSelectField";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchPanel } from "@/components/common/SearchPanel";
import { buildMenuTree, collectDescendantPageCodes, compareMenus, type MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { standardFieldSx } from "@/components/common/FormControls";
import { getUsers, resetUserPassword, saveUser, USER_PAGE_SIZE, type UserSearchParams } from "@/modules/system/user-management/api";
import { listDepartments, type DepartmentRecord } from "@/modules/code/departments/api";
import { MenuPermissionCard, type MenuPermissionRowLike } from "@/components/common/MenuPermissionCard";
import { listSystemMenus, type SystemMenuRecord } from "@/modules/system/menus/api";
import { listSystemRoles, type SystemRoleRecord } from "@/modules/system/roles/api";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  listUserMenuPermissions,
  saveUserMenuPermissions,
  type UserMenuPermissionRecord,
} from "@/modules/system/user-permission-management/api";
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
  label: user.useYn ? "활성" : "비활성",
});

const toDeptOption = (dept: DepartmentRecord) => ({
  label: dept.deptName,
  value: dept.deptCode,
});

const toRoleOption = (role: SystemRoleRecord) => ({
  label: role.roleName,
  value: role.roleCode,
});

const activeRoleSelectDataSource = defineCommonSelectDataSource<SystemRoleRecord, string>({
  labelKey: "roleName",
  loadingLabel: "그룹을 불러오는 중입니다.",
  params: { use_yn: true },
  queryKey: ["system-roles", "use_yn=true"],
  uri: "/system/permissions/roles",
  valueKey: "roleCode",
});

const DEFAULT_TEMP_PASSWORD = "0000";
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
  const queryClient = useQueryClient();
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
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "info" | "success" } | null>(null);

  const [expandedMenuCodes, setExpandedMenuCodes] = useState<string[]>([]);
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [baselinePermissionRows, setBaselinePermissionRows] = useState<PermissionRow[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const departmentsQuery = useQuery({
    queryKey: ["departments", "useYn=true"],
    queryFn: () => listDepartments({ useYn: true }),
    enabled: tabQueryEnabled,
  });

  const rolesQuery = useQuery({
    queryKey: ["system-roles", "use_yn=true"],
    queryFn: () => listSystemRoles({ useYn: true }),
    enabled: tabQueryEnabled,
  });

  const menuQuery = useQuery({
    queryKey: ["system-menus"],
    queryFn: listSystemMenus,
    enabled: tabQueryEnabled,
  });

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

  const draftGroupFallbackOptions = useMemo(() => {
    if (!draftUser.groupCode || groupOptions.some((option) => option.value === draftUser.groupCode)) {
      return [];
    }

    return [{ label: draftUser.groupCode, value: draftUser.groupCode }];
  }, [draftUser.groupCode, groupOptions]);

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

  const queryCriteria = useMemo<UserSearchParams>(
    () => ({
      keyword: appliedKeyword,
      page,
      useYn: useYnFilter,
      groupCode: groupFilter,
      deptCode: deptFilter,
    }),
    [appliedKeyword, deptFilter, groupFilter, page, useYnFilter],
  );

  const usersQuery = useQuery({
    queryKey: ["auth-users", queryCriteria, searchTick],
    queryFn: () => getUsers(queryCriteria),
    enabled: tabQueryEnabled,
  });

  const usersPage = usersQuery.data ?? { content: EMPTY_USERS, page, size: USER_PAGE_SIZE, totalElements: 0, totalPages: 0 };
  const users = usersQuery.data?.content ?? EMPTY_USERS;
  const userColumns = useMemo<GridColDef<AuthUserAccount>[]>(
    () => [
      { field: "userName", headerName: "이름", width: 120 },
      { field: "loginId", headerName: "로그인 ID", minWidth: 150, flex: 0.9 },
      {
        field: "deptCode",
        headerName: "부서",
        minWidth: 180,
        flex: 1,
        valueGetter: (_value, row) => optionLabel(deptOptions, row.deptCode),
      },
      {
        field: "groupCode",
        headerName: "그룹",
        width: 130,
        valueGetter: (_value, row) => optionLabel(groupOptions, row.groupCode),
      },
      {
        field: "useYn",
        headerName: "상태",
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
        headerName: "최근 로그인",
        minWidth: 160,
        flex: 0.8,
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
        setNotice({
          message: error instanceof Error ? error.message : "사용자 권한 정보를 불러오지 못했습니다.",
          severity: "error",
        });
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
  }, [menus, selectedUser?.loginId]);

  const saveMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: (savedUser) => {
      setSelectedEmployeeNo(savedUser.employeeNo);
      setDraftUser({ ...savedUser, userPassword: "" });
      setPasswordConfirm("");
      queryClient.invalidateQueries({ queryKey: ["auth-users"] });
      setNotice({ message: "사용자 계정을 저장했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({
        message: error instanceof Error ? error.message : "사용자 계정 저장에 실패했습니다.",
        severity: "error",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (savedUser) => {
      setSelectedEmployeeNo(savedUser.employeeNo);
      setDraftUser({ ...savedUser, userPassword: "" });
      setPasswordConfirm("");
      queryClient.invalidateQueries({ queryKey: ["auth-users"] });
      setNotice({ message: "비밀번호를 0000으로 초기화했습니다.", severity: "success" });
    },
    onError: (error) => {
      setNotice({
        message: error instanceof Error ? error.message : "비밀번호 초기화에 실패했습니다.",
        severity: "error",
      });
    },
  });

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
    setNotice({ message: "새 계정 등록 모드로 전환했습니다.", severity: "info" });
  };



  const handleSaveUser = () => {
    if ((draftUser.userPassword || passwordConfirm) && draftUser.userPassword !== passwordConfirm) {
      setNotice({ message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.", severity: "error" });
      return;
    }
    saveMutation.mutate(draftUser);
  };

  const handleResetPassword = () => {
    if (!selectedUser) {
      setNotice({ message: "비밀번호를 초기화할 사용자를 먼저 선택하세요.", severity: "error" });
      return;
    }

    resetPasswordMutation.mutate(selectedUser.employeeNo);
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
      setNotice({ message: "먼저 권한을 저장할 사용자를 선택하세요.", severity: "error" });
      return;
    }

    const loginId = selectedUser.loginId.trim();
    if (!loginId) {
      setNotice({ message: "로그인 ID가 없는 사용자는 권한을 저장할 수 없습니다.", severity: "error" });
      return;
    }

    setPermissionSaving(true);
    try {
      const savedPermissions = await saveUserMenuPermissions(loginId, {
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
      setNotice({ message: "사용자 권한이 저장되었습니다.", severity: "success" });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "사용자 권한을 저장하지 못했습니다.",
        severity: "error",
      });
    } finally {
      setPermissionSaving(false);
    }
  };

  const visibleTab: UserManagementTab = selectedUser ? activeTab : "details";

  return (
    <Box>
      <PageHeader title="사용자 관리" />

      {notice ? (
        <Box sx={{ position: "sticky", top: 16, zIndex: 2, mb: 2 }}>
          <Alert severity={notice.severity} variant="filled">
            {notice.message}
          </Alert>
        </Box>
      ) : null}

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
          <CommonSelectField
            label="사용 상태"
            onChange={(value) => setUseYnFilter((value || "All") as "All" | "Y" | "N")}
            options={[
              { label: "전체", value: "All" },
              { label: "활성", value: "Y" },
              { label: "비활성", value: "N" },
            ]}
            placeholder="전체"
            placeholderDisabled={false}
            sx={{ ...standardFieldSx, minWidth: 150 }}
            value={useYnFilter}
          />
          <CommonSelectField<SystemRoleRecord, string>
            {...activeRoleSelectDataSource}
            label="그룹"
            leadingOptions={[{ label: "전체", value: "All" }]}
            onChange={(value) => setGroupFilter(value || "All")}
            placeholder="전체"
            placeholderDisabled={false}
            sx={{ ...standardFieldSx, minWidth: 170 }}
            value={groupFilter}
          />
          <CommonSelectField
            label="부서"
            onChange={(value) => setDeptFilter(value || "All")}
            options={[{ label: "전체", value: "All" }, ...deptOptions]}
            placeholder="전체"
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
                    사용자 목록
                  </Typography>
                </Box>
                <Chip label={`총 ${usersPage.totalElements}건`} size="small" variant="outlined" />
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
                    사용자 관리 상세
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedUser ? `${selectedUser.employeeNo} / ${selectedUser.loginId}` : "새 계정을 작성 중입니다."}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
                  <Chip icon={<SecurityOutlinedIcon />} label={selectedStatus.label} color={selectedStatus.color} />
                  <Chip label={`부서 ${optionLabel(deptOptions, draftUser.deptCode)}`} variant="outlined" />
                  <Chip label={`그룹 ${optionLabel(groupOptions, draftUser.groupCode)}`} variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Tabs
                onChange={(_, value: UserManagementTab) => setActiveTab(value)}
                value={visibleTab}
                variant="fullWidth"
                sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0.75 } }}
              >
                <Tab label="사용자 상세" value="details" />
                <Tab disabled={!selectedUser} label="메뉴 권한" value="permissions" />
              </Tabs>

              <Box sx={{ pt: 2 }}>
                {visibleTab === "details" ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", width: "100%" }}>
                        <Button
                            disabled={!canUpdate || !selectedUser || resetPasswordMutation.isPending}
                            onClick={handleResetPassword}
                            startIcon={<RestartAltOutlinedIcon />}
                            variant="outlined"
                            sx={{ mr: "auto" }}
                        >
                          비밀번호 초기화
                        </Button>
                        <Button disabled={!canCreate} onClick={handleNewUser} startIcon={<AddOutlinedIcon />} variant="outlined">
                          신규
                        </Button>
                        <Button
                          disabled={saveMutation.isPending || (selectedUser ? !canUpdate : !canCreate)}
                          onClick={handleSaveUser}
                          startIcon={<SaveOutlinedIcon />}
                          variant="contained"
                        >
                          저장
                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle1">
                          프로필
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField
                            fullWidth
                            label="사번"
                            onChange={(event) => updateDraft("employeeNo", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.employeeNo}
                            disabled={Boolean(selectedUser)}
                          />
                          <TextField
                            fullWidth
                            label="이름"
                            onChange={(event) => updateDraft("userName", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.userName}
                          />
                          <TextField
                            fullWidth
                            label="로그인 ID"
                            onChange={(event) => updateDraft("loginId", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.loginId}
                          />
                          <TextField
                            fullWidth
                            label="이메일"
                            onChange={(event) => updateDraft("email", event.target.value)}
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.email}
                          />
                          <CommonSelectField<SystemRoleRecord, string>
                            {...activeRoleSelectDataSource}
                            label="그룹"
                            onChange={(value) => updateDraft("groupCode", value)}
                            placeholder="선택"
                            sx={standardFieldSx}
                            trailingOptions={draftGroupFallbackOptions}
                            value={draftUser.groupCode}
                          />
                          <TextField
                            fullWidth
                            label="부서"
                            onChange={(event) => updateDraft("deptCode", event.target.value)}
                            select
                            size="small"
                            sx={standardFieldSx}
                            value={draftUser.deptCode}
                          >
                            <MenuItem value="">선택</MenuItem>
                            {deptOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Box sx={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 2 }}>
                            <FormControlLabel
                              control={<Switch checked={draftUser.useYn} onChange={(_, checked) => updateDraft("useYn", checked)} size="small" />}
                              label="활성"
                            />
                            <FormControlLabel
                              control={
                                <Switch checked={draftUser.picYn === "Y"} onChange={(_, checked) => updateDraft("picYn", checked ? "Y" : "N")} size="small" />
                              }
                              label="담당자"
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle1">
                          보안
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField
                            fullWidth
                            label="비밀번호"
                            helperText={selectedUser ? "현재 비밀번호를 유지하려면 비워두세요." : "새 계정에는 비밀번호가 필요합니다."}
                            onChange={(event) => updateDraft("userPassword", event.target.value.replace(/\s/g, ""))}
                            size="small"
                            sx={standardFieldSx}
                            type={showPassword ? "text" : "password"}
                            value={draftUser.userPassword}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} edge="end" onClick={() => setShowPassword((current) => !current)} size="small">
                                      {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                          <TextField
                            fullWidth
                            label="비밀번호 확인"
                            onChange={(event) => setPasswordConfirm(event.target.value.replace(/\s/g, ""))}
                            size="small"
                            sx={standardFieldSx}
                            type={showPasswordConfirm ? "text" : "password"}
                            value={passwordConfirm}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton aria-label={showPasswordConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"} edge="end" onClick={() => setShowPasswordConfirm((current) => !current)} size="small">
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
                          이력
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                          <TextField fullWidth label="최근 IP" size="small" sx={standardFieldSx} value={draftUser.recentIpAddr} disabled />
                          <TextField fullWidth label="최근 로그인" size="small" sx={standardFieldSx} value={draftUser.loginDt} disabled />
                          <TextField fullWidth label="최근 로그아웃" size="small" sx={standardFieldSx} value={draftUser.logoutDt} disabled />
                          <TextField fullWidth label="최종 변경일" size="small" sx={standardFieldSx} value={draftUser.lastChngDt} disabled />
                        </Box>
                      </Box>

                      <Divider />

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip label={selectedUser ? "수정 모드" : "신규 등록"} />
                        <Chip label={`그룹 ${optionLabel(groupOptions, draftUser.groupCode)}`} variant="outlined" />
                        <Chip label={`부서 ${optionLabel(deptOptions, draftUser.deptCode)}`} variant="outlined" />
                        <Chip label={`최종 변경 ${formatValue(draftUser.lastChngDt)}`} variant="outlined" />
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {selectedUser ? (
                      <>
                        <MenuPermissionCard
                          badgeLabel={`${permissionRows.length}건 메뉴`}
                          description="사용자별 메뉴 접근 권한을 관리합니다."
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
                          saveDisabled={!selectedUser || permissionLoading || permissionSaving}
                          title="메뉴 권한"
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
                          메뉴 권한을 편집할 사용자를 먼저 선택하세요.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
