import { readAuthSessionSnapshot, type MenuPermission } from "@/lib/auth/authSession";

const normalizePath = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed === "/") {
    return "/";
  }

  return trimmed.replace(/\/+$/, "");
};

export const compareMenuPermissions = (left: MenuPermission, right: MenuPermission) =>
  left.sortSeq - right.sortSeq || left.menuCode.localeCompare(right.menuCode);

export const getSessionMenuPermissions = () => readAuthSessionSnapshot()?.permissions ?? [];

export const getVisibleMenuPermissions = (permissions: MenuPermission[] = []) =>
  permissions.filter((permission) => permission.useYn && permission.visibleYn).sort(compareMenuPermissions);

export const getReadableMenuPermissions = (permissions: MenuPermission[] = []) =>
  getVisibleMenuPermissions(permissions).filter((permission) => permission.readYn);

export const matchesMenuPath = (pathname: string, permission: MenuPermission) => {
  const targetPath = normalizePath(pathname);
  const menuPath = normalizePath(permission.menuPath);

  if (!menuPath) {
    return false;
  }

  return targetPath === menuPath || targetPath.startsWith(`${menuPath}/`);
};

export const findMenuPermissionByPath = (pathname: string, permissions: MenuPermission[] = []) =>
  getReadableMenuPermissions(permissions)
    .filter((permission) => matchesMenuPath(pathname, permission))
    .sort((left, right) => normalizePath(right.menuPath).length - normalizePath(left.menuPath).length)
    .at(0);

export const findMenuPermissionByCode = (menuCode: string, permissions: MenuPermission[] = []) =>
  getVisibleMenuPermissions(permissions).find((permission) => permission.menuCode === menuCode);

export const findMenuPermissionByExactPath = (menuPath: string, permissions: MenuPermission[] = []) => {
  const normalizedPath = normalizePath(menuPath);
  return getVisibleMenuPermissions(permissions).find((permission) => normalizePath(permission.menuPath) === normalizedPath);
};

export const getReadableMenuChildren = (parentMenuCode: string, permissions: MenuPermission[] = []) =>
  getReadableMenuPermissions(permissions).filter((permission) => permission.parentMenuCode === parentMenuCode);

export type MenuPermissionGroup = {
  children: MenuPermission[];
  group: MenuPermission;
};

export const getReadableMenuGroupsByRootPath = (rootPath: string, permissions: MenuPermission[] = []) => {
  const root = findMenuPermissionByExactPath(rootPath, permissions);

  if (!root) {
    return [];
  }

  const directChildren = getReadableMenuChildren(root.menuCode, permissions);
  const groups: MenuPermissionGroup[] = [];

  for (const child of directChildren) {
    const children = getReadableMenuChildren(child.menuCode, permissions).filter((permission) => permission.menuPath);

    if (children.length > 0) {
      groups.push({ group: child, children });
      continue;
    }

    if (child.menuPath) {
      groups.push({ group: child, children: [child] });
    }
  }

  return groups;
};

export const getReadableMenuPagesByRootPath = (rootPath: string, permissions: MenuPermission[] = []) => {
  const root = findMenuPermissionByExactPath(rootPath, permissions);

  if (!root) {
    return [];
  }

  return getReadableMenuChildren(root.menuCode, permissions).filter((permission) => permission.menuPath);
};
