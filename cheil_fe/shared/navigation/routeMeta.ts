import type { MenuPermission } from "@/lib/auth/authSession";
import {
  findMenuPermissionByExactPath,
  findMenuPermissionByPath,
  getVisibleMenuPermissions,
} from "@/shared/navigation/menuPermissionUtils";

export type BreadcrumbItem = {
  current: boolean;
  href?: string;
  label: string;
};

const dashboardLabel = "Dashboard";

export function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

const labelFromSegment = (segment?: string) =>
  segment ? decodeURIComponent(segment).replace(/[-_]+/g, " ") : dashboardLabel;

export function getPageLabel(pathname: string, permissions: MenuPermission[] = []) {
  if (pathname === "/" || pathname === "/dashboard") {
    return dashboardLabel;
  }

  const permission = findMenuPermissionByExactPath(pathname, permissions) ?? findMenuPermissionByPath(pathname, permissions);
  if (permission) {
    return permission.menuName;
  }

  return labelFromSegment(getPathSegments(pathname).at(-1));
}

const fallbackBreadcrumbItems = (pathname: string): BreadcrumbItem[] => {
  const segments = getPathSegments(pathname);

  return segments.map((segment, index) => ({
    current: index === segments.length - 1,
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: labelFromSegment(segment),
  }));
};

export function getBreadcrumbItems(pathname: string, permissions: MenuPermission[] = []): BreadcrumbItem[] {
  if (pathname === "/" || pathname === "/dashboard") {
    return [{ current: true, label: dashboardLabel }];
  }

  const currentPermission = findMenuPermissionByExactPath(pathname, permissions);

  if (!currentPermission) {
    return fallbackBreadcrumbItems(pathname);
  }

  const permissionByCode = new Map(getVisibleMenuPermissions(permissions).map((permission) => [permission.menuCode, permission]));
  const chain: MenuPermission[] = [];
  let cursor: MenuPermission | undefined = currentPermission;

  while (cursor) {
    chain.unshift(cursor);

    if (!cursor.parentMenuCode || cursor.parentMenuCode === cursor.menuCode) {
      break;
    }

    const parent = permissionByCode.get(cursor.parentMenuCode);
    if (!parent) {
      break;
    }

    cursor = parent;
  }

  return chain.map((permission, index) => ({
    current: index === chain.length - 1,
    href: permission.menuPath ?? undefined,
    label: permission.menuName,
  }));
}
