"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { type MenuPermission } from "@/lib/auth/authSession";
import { useAuthSession } from "@/lib/auth/useAuthSession";

const EMPTY_PERMISSIONS: MenuPermission[] = [];

const matchesPath = (pathname: string, permission: MenuPermission) => {
  if (!permission.menuPath) {
    return false;
  }

  return pathname === permission.menuPath || pathname.startsWith(`${permission.menuPath}/`);
};

export function useCurrentMenuPermission() {
  const pathname = usePathname();
  const permissions = useAuthSession()?.permissions ?? EMPTY_PERMISSIONS;

  return useMemo(() => {
    const permission = permissions
      ?.filter((item) => matchesPath(pathname, item))
      .sort((left, right) => (right.menuPath?.length ?? 0) - (left.menuPath?.length ?? 0))
      .at(0);

    return {
      canCreate: permission?.readYn === true && permission.createYn === true,
      canDelete: permission?.readYn === true && permission.deleteYn === true,
      canRead: permission?.readYn === true,
      canUpdate: permission?.readYn === true && permission.updateYn === true,
      menuCode: permission?.menuCode ?? null,
      permission: permission ?? null,
    };
  }, [pathname, permissions]);
}

export function useMenuPermission(menuCode: string) {
  const permissions = useAuthSession()?.permissions ?? EMPTY_PERMISSIONS;

  return useMemo(() => {
    const permission = permissions?.find((item) => item.menuCode === menuCode);

    return {
      canCreate: permission?.readYn === true && permission.createYn === true,
      canDelete: permission?.readYn === true && permission.deleteYn === true,
      canRead: permission?.readYn === true,
      canUpdate: permission?.readYn === true && permission.updateYn === true,
      permission: permission ?? null,
    };
  }, [menuCode, permissions]);
}
