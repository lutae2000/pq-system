import type { Meta, StoryObj } from "@storybook/nextjs";
import { useMemo, useState } from "react";
import type { MenuTreeNode } from "@/lib/permissions/menuPermissionTree";
import { MenuPermissionCard, type MenuPermissionRowLike } from "../MenuPermissionCard";

const menuTree: MenuTreeNode[] = [
  {
    record: {
      description: null,
      menuCode: "SYSTEM",
      menuName: "시스템 관리",
      menuPath: null,
      menuType: "GROUP",
      parentMenuCode: null,
      sortSeq: 1,
      useYn: true,
      visibleYn: true,
    },
    children: [
      {
        record: {
          description: null,
          menuCode: "USER_MGMT",
          menuName: "사용자 관리",
          menuPath: "/system/user-management",
          menuType: "PAGE",
          parentMenuCode: "SYSTEM",
          sortSeq: 1,
          useYn: true,
          visibleYn: true,
        },
        children: [],
      },
      {
        record: {
          description: null,
          menuCode: "ROLE_MGMT",
          menuName: "역할 권한 관리",
          menuPath: "/system/roles",
          menuType: "PAGE",
          parentMenuCode: "SYSTEM",
          sortSeq: 2,
          useYn: true,
          visibleYn: true,
        },
        children: [],
      },
    ],
  },
];

const initialPermissions: MenuPermissionRowLike[] = [
  { menuCode: "SYSTEM", read: true, create: false, update: false, delete: false },
  { menuCode: "USER_MGMT", read: true, create: true, update: true, delete: false },
  { menuCode: "ROLE_MGMT", read: true, create: false, update: false, delete: false },
];

const meta = {
  title: "Common/MenuPermissionCard",
  component: MenuPermissionCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MenuPermissionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
  args: {
    badgeLabel: "변경 1건",
    description: "역할별 메뉴 접근 권한을 관리합니다.",
    expandedMenuCodeSet: new Set(["SYSTEM"]),
    isPermissionChanged: () => false,
    menuTree,
    onSave: () => undefined,
    onToggleAll: () => undefined,
    onToggleCell: () => undefined,
    onToggleExpand: () => undefined,
    permissionByMenuCode: new Map(initialPermissions.map((permission) => [permission.menuCode, permission])),
    title: "권한 설정",
  },
  render: () => {
    const [expanded, setExpanded] = useState(new Set(["SYSTEM"]));
    const [permissions, setPermissions] = useState(initialPermissions);
    const changedCodes = useMemo(() => new Set(["USER_MGMT"]), []);

    const permissionByMenuCode = useMemo(
      () => new Map(permissions.map((permission) => [permission.menuCode, permission])),
      [permissions],
    );

    const updatePermission = (menuCode: string, updater: (permission: MenuPermissionRowLike) => MenuPermissionRowLike) => {
      setPermissions((current) =>
        current.map((permission) => (permission.menuCode === menuCode ? updater(permission) : permission)),
      );
    };

    return (
      <MenuPermissionCard
        badgeLabel="변경 1건"
        description="역할별 메뉴 접근 권한을 관리합니다."
        expandedMenuCodeSet={expanded}
        isPermissionChanged={(menuCode) => changedCodes.has(menuCode)}
        menuTree={menuTree}
        onSave={() => undefined}
        onToggleAll={(menuCode) =>
          updatePermission(menuCode, (permission) => {
            const next = !(permission.read && permission.create && permission.update && permission.delete);
            return { ...permission, read: next, create: next, update: next, delete: next };
          })
        }
        onToggleCell={(menuCode, field) =>
          updatePermission(menuCode, (permission) => ({ ...permission, [field]: !permission[field] }))
        }
        onToggleExpand={(menuCode) =>
          setExpanded((current) => {
            const next = new Set(current);
            if (next.has(menuCode)) {
              next.delete(menuCode);
            } else {
              next.add(menuCode);
            }
            return next;
          })
        }
        permissionByMenuCode={permissionByMenuCode}
        title="권한 설정"
      />
    );
  },
};
