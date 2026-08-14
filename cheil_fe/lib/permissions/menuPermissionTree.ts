import type { SystemMenuRecord } from "@/modules/system/menus/api";

export type MenuTreeNode = {
  children: MenuTreeNode[];
  record: SystemMenuRecord;
};

export type MenuTreeRow = {
  depth: number;
  node: MenuTreeNode;
};

export const compareMenus = (left: SystemMenuRecord, right: SystemMenuRecord) => {
  if (left.sortSeq !== right.sortSeq) {
    return left.sortSeq - right.sortSeq;
  }
  return left.menuCode.localeCompare(right.menuCode);
};

export const buildMenuTree = (records: SystemMenuRecord[]) => {
  const nodes = new Map<string, MenuTreeNode>(records.map((record) => [record.menuCode, { record, children: [] }]));
  const roots: MenuTreeNode[] = [];

  records.forEach((record) => {
    const node = nodes.get(record.menuCode);
    if (!node) {
      return;
    }

    const parentCode = record.parentMenuCode?.trim();
    if (!parentCode || parentCode === record.menuCode) {
      roots.push(node);
      return;
    }

    const parentNode = nodes.get(parentCode);
    if (!parentNode) {
      roots.push(node);
      return;
    }

    parentNode.children.push(node);
  });

  const sortTree = (treeNode: MenuTreeNode): MenuTreeNode => ({
    ...treeNode,
    children: [...treeNode.children].sort((left, right) => compareMenus(left.record, right.record)).map(sortTree),
  });

  return roots.sort((left, right) => compareMenus(left.record, right.record)).map(sortTree);
};

export const flattenMenuTree = (nodes: MenuTreeNode[], expanded: Set<string>, depth = 0): MenuTreeRow[] =>
  nodes.flatMap((node) => {
    const currentRow: MenuTreeRow = { depth, node };
    if (!node.children.length || !expanded.has(node.record.menuCode)) {
      return [currentRow];
    }

    return [currentRow, ...flattenMenuTree(node.children, expanded, depth + 1)];
  });

export const collectDescendantPageCodes = (node: MenuTreeNode): string[] =>
  node.children.flatMap((child) => [
    ...(child.record.menuType === "PAGE" ? [child.record.menuCode] : []),
    ...collectDescendantPageCodes(child),
  ]);
