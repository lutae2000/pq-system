import type { MenuPermission } from "@/lib/auth/authSession";
import {
  findMenuPermissionByExactPath,
  findMenuPermissionByPath,
  getReadableMenuPermissions,
} from "@/shared/navigation/menuPermissionUtils";

export type BreadcrumbItem = {
  current: boolean;
  href?: string;
  label: string;
};

const dashboardLabel = "Dashboard";

const buildTwoLevelBreadcrumb = (parentHref: string, parentLabel: string, currentLabel: string): BreadcrumbItem[] => [
  { current: false, href: parentHref, label: parentLabel },
  { current: true, label: currentLabel },
];

const routeLabelBySegment: Record<string, string> = {
  "education-reminders": "교육",
  "basic-infos": "기초 정보 관리",
  completions: "교육 알림 이수 관리",
  templates: "템플릿 관리",
  "send-history": "교육알림 발송 이력",
};

const routeMetaByPath: Partial<Record<string, { breadcrumbItems?: BreadcrumbItem[]; pageLabel?: string }>> = {
  "/pq": {
    breadcrumbItems: [{ current: true, label: "신기술" }],
    pageLabel: "신기술",
  },
  "/pq/new-technology-developments": {
    breadcrumbItems: buildTwoLevelBreadcrumb("/pq", "신기술", "개발실적"),
    pageLabel: "개발실적",
  },
  "/pq/new-technology-investments": {
    breadcrumbItems: buildTwoLevelBreadcrumb("/pq", "신기술", "투자실적"),
    pageLabel: "투자실적",
  },
  "/pq/new-technology-usages": {
    breadcrumbItems: buildTwoLevelBreadcrumb("/pq", "신기술", "활용실적"),
    pageLabel: "활용실적",
  },
  "/education-reminders": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "기초 정보 관리" },
    ],
    pageLabel: "기초 정보 관리",
  },
  "/education-reminders/basic-infos": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "기초 정보 관리" },
    ],
    pageLabel: "기초 정보 관리",
  },
  "/education-reminders/completions": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "교육 알림 이수 관리" },
    ],
  },
  "/education-reminders/templates": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "템플릿 관리" },
    ],
  },
  "/education-reminders/send-history": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "교육알림 발송 이력" },
    ],
    pageLabel: "교육알림 발송 이력",
  },
  "/pq/education-reminders": {
    breadcrumbItems: [
      { current: false, href: "/education-reminders", label: "교육" },
      { current: true, label: "기초 정보 관리" },
    ],
    pageLabel: "기초 정보 관리",
  },
};

export function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

const labelFromSegment = (segment?: string) =>
  segment ? routeLabelBySegment[segment] ?? decodeURIComponent(segment) : dashboardLabel;

export function getPageLabel(pathname: string, permissions: MenuPermission[] = []) {
  if (pathname === "/" || pathname === "/dashboard") {
    return dashboardLabel;
  }

  const routeMeta = routeMetaByPath[pathname];
  if (routeMeta?.pageLabel) {
    return routeMeta.pageLabel;
  }

  const permission = findMenuPermissionByExactPath(pathname, permissions) ?? findMenuPermissionByPath(pathname, permissions);
  if (permission) {
    return permission.menuName;
  }

  return labelFromSegment(getPathSegments(pathname).at(-1));
}

const fallbackBreadcrumbItems = (pathname: string): BreadcrumbItem[] => {
  const routeMeta = routeMetaByPath[pathname];
  if (routeMeta?.breadcrumbItems) {
    return routeMeta.breadcrumbItems;
  }

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

  const routeMeta = routeMetaByPath[pathname];
  if (routeMeta?.breadcrumbItems) {
    return routeMeta.breadcrumbItems;
  }

  const currentPermission = findMenuPermissionByExactPath(pathname, permissions);

  if (!currentPermission) {
    return fallbackBreadcrumbItems(pathname);
  }

  const permissionByCode = new Map(getReadableMenuPermissions(permissions).map((permission) => [permission.menuCode, permission]));
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
