import type { Meta, StoryObj } from "@storybook/nextjs";
import { useMemo, useState } from "react";

import type { MenuTreeNode } from "@/lib/permissions/menuPermissionTree";

import { MenuPermissionCard, type MenuPermissionRowLike } from "../MenuPermissionCard";

const menuTree: MenuTreeNode[] = [
  {
    record: {
      createdAt: "2026-08-18T00:00:00.000Z",
      createdId: null,
      description: null,
      menuCode: "SYSTEM",
      menuName: "System Management",
      menuPath: null,
      menuType: "GROUP",
      parentMenuCode: null,
      sortSeq: 1,
      useYn: true,
      visibleYn: true,
      lastChangedAt: "2026-08-18T00:00:00.000Z",
      lastChangedId: null,
    },
    children: [
      {
        record: {
          createdAt: "2026-08-18T00:00:00.000Z",
          createdId: null,
          description: null,
          menuCode: "USER_MGMT",
          menuName: "User Management",
          menuPath: "/system/user-management",
          menuType: "PAGE",
          parentMenuCode: "SYSTEM",
          sortSeq: 1,
          useYn: true,
          visibleYn: true,
          lastChangedAt: "2026-08-18T00:00:00.000Z",
          lastChangedId: null,
        },
        children: [],
      },
      {
        record: {
          createdAt: "2026-08-18T00:00:00.000Z",
          createdId: null,
          description: null,
          menuCode: "ROLE_MGMT",
          menuName: "Role Permission",
          menuPath: "/system/roles",
          menuType: "PAGE",
          parentMenuCode: "SYSTEM",
          sortSeq: 2,
          useYn: true,
          visibleYn: true,
          lastChangedAt: "2026-08-18T00:00:00.000Z",
          lastChangedId: null,
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
    badgeLabel: "Changed 1",
    description: "A simple permission card story.",
    expandedMenuCodeSet: new Set(["SYSTEM"]),
    isPermissionChanged: () => false,
    menuTree,
    onSave: () => undefined,
    onToggleAll: () => undefined,
    onToggleCell: () => undefined,
    onToggleExpand: () => undefined,
    permissionByMenuCode: new Map(initialPermissions.map((permission) => [permission.menuCode, permission])),
    title: "Permissions",
  },
  render: () => <EditableStory />,
};

function EditableStory() {
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
        badgeLabel="Changed 1"
        description="A simple permission card story."
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
        title="Permissions"
        />
      );
}
