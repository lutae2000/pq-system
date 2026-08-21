import { readAuthSession, writeAuthSession, type MenuPermission } from "@/lib/auth/authSession";
import { listMyMenuPermissions } from "@/modules/auth/authApi";
import { isRegisteredPagePath } from "@/shared/navigation/pageRoutes";

export type MenuIconKey =
  | "analytics"
  | "campaign"
  | "certificate"
  | "users"
  | "settings"
  | "code"
  | "permissions"
  | "pq"
  | "notifications"
  | "education"
  | "codeCommonCode"
  | "codeDepartment"
  | "codeHeadquarters"
  | "permissionProgramManagement"
  | "pqAnnouncement"
  | "pqBid"
  | "pqCertificate"
  | "pqClientCode"
  | "pqCommonCode"
  | "pqCompanyPerformance"
  | "pqCompanyPerformanceEngineers"
  | "pqConstruction"
  | "pqDocumentEngineerPerformanceDocs"
  | "pqDocumentCompanyPerformanceDocs"
  | "pqDocumentParticipatingEngineers"
  | "pqDocumentEngineerOverlapCheck"
  | "pqEngineer"
  | "pqEngineerPerformance"
  | "pqNewEmploymentRates"
  | "pqNewTechnology"
  | "pqService"
  | "pqShinindo"
  | "pqSimilarServicePerformance"
  | "pqServicePerformance"
  | "pqWorkOverlap"
  | "notice";

export type MenuItemDto = {
  id: string;
  label: string;
  href?: string;
  icon: MenuIconKey;
  routeAvailable?: boolean;
  children?: MenuItemDto[];
};

const fallbackMenuItems: MenuItemDto[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "analytics",
  },
];

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const isRemovedMenu = (permission: MenuPermission) => {
  const code = normalize(permission.menuCode);
  const path = normalize(permission.menuPath);
  return (
    code.includes("business-place") ||
    path.includes("business-place") ||
    code.includes("system-management") ||
    path.includes("system-management")
  );
};

const iconForMenu = (permission: MenuPermission): MenuIconKey => {
  const code = normalize(permission.menuCode);
  const path = normalize(permission.menuPath);
  const name = normalize(permission.menuName);

  if (path === "/dashboard" || code.includes("dashboard")) return "analytics";
  if (code.includes("education") || path.includes("education")) return "education";
  if (code.includes("notification") || path.includes("/notifications")) return "notifications";
  if (code.includes("notice") || path.includes("/notices")) return "notice";
  if (code.includes("user") || path.includes("user-management")) return "users";
  if (code.includes("department") || path.includes("department")) return "codeDepartment";
  if (code.includes("common-code") || path.includes("common-code")) return "codeCommonCode";
  if (code.includes("headquarters") || path.includes("headquarters")) return "codeHeadquarters";
  if (code.includes("certificate") || path.includes("certificate")) return "pqCertificate";
  if (code.includes("client") || path.includes("client")) return "pqClientCode";
  if (code.includes("code") || path.startsWith("/code")) return "code";
  if (code.includes("menu-management") || path === "/system/menus") return "permissionProgramManagement";
  if (code.includes("role-permission") || path === "/system/roles") return "permissions";
  if (code.includes("permission") || path.startsWith("/system")) return "permissions";
  if (code.includes("engineer-overlap") || path.includes("engineer-overlap")) return "pqDocumentEngineerOverlapCheck";
  if (code.includes("performance-certificate") || path.includes("performance-certificate")) return "pqCertificate";
  if (code.includes("engineer-performance-doc") || path.includes("engineer-performance-doc")) return "pqDocumentEngineerPerformanceDocs";
  if (code.includes("participating-engineer") || path.includes("participating-engineer")) return "pqDocumentParticipatingEngineers";
  if (code.includes("company-performance-doc") || path.includes("company-performance-doc")) return "pqDocumentCompanyPerformanceDocs";
  if (code.includes("company-performance-engineer") || path.includes("company-performance-engineer")) return "pqCompanyPerformanceEngineers";
  if (code.includes("construction") || path.includes("construction")) return "pqConstruction";
  if (code.includes("new-technology") || path.includes("new-technology")) return "pqNewTechnology";
  if (code.includes("new-employment") || path.includes("new-employment")) return "pqNewEmploymentRates";
  if (code.includes("shinindo") || path.includes("shinindo")) return "pqShinindo";
  if (code.includes("work-overlap") || path.includes("work-overlap")) return "pqWorkOverlap";
  if (code.includes("similar-service-performance") || path.includes("similar-service-performance")) return "pqSimilarServicePerformance";
  if (code.includes("service-performance") || path.includes("service-performance")) return "pqServicePerformance";
  if (name.includes("입찰") || code.includes("bid") || path.includes("bid-notice") || path.includes("/bids")) return "pqBid";
  if (code.includes("announcement") || path.includes("announcement")) return "pqAnnouncement";
  if (code.includes("engineer-performance") || path.includes("engineers/performance")) return "pqEngineerPerformance";
  if (code.includes("performance") || path.includes("performance")) return "pqCompanyPerformance";
  if (code.includes("engineer") || path.includes("engineer")) return "pqEngineer";
  if (code.includes("service") || path.includes("service")) return "pqService";
  if (code.includes("pq") || path.includes("/pq")) return "pq";
  return "settings";
};

const comparePermissions = (left: MenuPermission, right: MenuPermission) => {
  const sortCompare = left.sortSeq - right.sortSeq;
  return sortCompare === 0 ? left.menuCode.localeCompare(right.menuCode) : sortCompare;
};

const buildMenuTree = (permissions: MenuPermission[]) => {
  const visiblePermissions = permissions
    .filter((item) => item.useYn && item.visibleYn && !isRemovedMenu(item))
    .sort(comparePermissions);
  const permissionByCode = new Map(visiblePermissions.map((item) => [item.menuCode, item]));
  const childrenByParent = new Map<string, MenuPermission[]>();
  const roots: MenuPermission[] = [];

  for (const permission of visiblePermissions) {
    const parentCode = permission.parentMenuCode?.trim();

    if (!parentCode || !permissionByCode.has(parentCode) || parentCode === permission.menuCode) {
      roots.push(permission);
      continue;
    }

    childrenByParent.set(parentCode, [...(childrenByParent.get(parentCode) ?? []), permission]);
  }

  const toMenuItem = (permission: MenuPermission): MenuItemDto | null => {
    const children = (childrenByParent.get(permission.menuCode) ?? [])
      .map(toMenuItem)
      .filter((item): item is MenuItemDto => item !== null);
    const menuPath = permission.menuPath?.trim() || undefined;
    const routeAvailable = menuPath ? isRegisteredPagePath(menuPath) : true;
    const canEnter = permission.readYn && Boolean(menuPath);

    if (!canEnter && children.length === 0) {
      return null;
    }

    return {
      id: permission.menuCode,
      label: permission.menuName,
      href: canEnter ? menuPath : undefined,
      icon: iconForMenu(permission),
      routeAvailable,
      ...(children.length > 0 ? { children } : {}),
    };
  };

  return roots
    .map(toMenuItem)
    .filter((item): item is MenuItemDto => item !== null);
};

export async function getMenuItems() {
  const session = readAuthSession();

  if (!session) {
    return fallbackMenuItems;
  }

  if (session.permissions?.length) {
    return buildMenuTree(session.permissions);
  }

  const permissions = await listMyMenuPermissions();
  writeAuthSession({ ...session, permissions });
  return buildMenuTree(permissions);
}
