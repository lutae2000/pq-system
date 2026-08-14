import { listCommonCodes, type CommonCodeRecord, type CommonCodeSearchParams } from "@/modules/code/common-codes/api";
import { listClientCodes, type ClientCodeRecord, type ClientCodeSearchParams } from "@/modules/code/clients/api";
import {
  listConstructionTypes,
  type ConstructionTypeRecord,
  type ConstructionTypeSearchParams,
} from "@/modules/code/construction-types/api";
import { listDepartments, type DepartmentRecord, type DepartmentSearchParams } from "@/modules/code/departments/api";
import { getUsers, type UserSearchParams } from "@/modules/system/user-management/api";
import { listSystemRoles, type SystemRoleRecord, type SystemRoleSearchParams } from "@/modules/system/roles/api";
import type { AuthUserAccount } from "@/types/user";

const DEFAULT_REFERENCE_USER_SIZE = 200;
const DEFAULT_REFERENCE_CLIENT_SIZE = 200;

export type ReferenceOption<TItem = unknown> = {
  item: TItem;
  label: string;
  value: string;
};

export type ReferenceQueryResult<TItem> = {
  items: TItem[];
  labelByValue: Record<string, string>;
  options: Array<ReferenceOption<TItem>>;
};

export type UserReferenceSearchParams = Partial<Omit<UserSearchParams, "deptCode" | "groupCode" | "keyword" | "page" | "useYn">> & {
  deptCode?: string;
  groupCode?: string;
  keyword?: string;
  page?: number;
  useYn?: UserSearchParams["useYn"];
};

export type ClientReferenceSearchParams = Partial<
  Omit<ClientCodeSearchParams, "businessName" | "companyType" | "orderClass" | "page" | "size">
> & {
  businessName?: string;
  companyType?: string;
  orderClass?: string;
  page?: number;
  size?: number;
};

const sortByLabel = <TItem>(left: ReferenceOption<TItem>, right: ReferenceOption<TItem>) =>
  left.label.localeCompare(right.label) || left.value.localeCompare(right.value);

const sortBySortSeq = <TItem extends { sortSeq?: number | string | null }>(
  left: ReferenceOption<TItem>,
  right: ReferenceOption<TItem>,
) => Number(left.item.sortSeq ?? 0) - Number(right.item.sortSeq ?? 0) || sortByLabel(left, right);

const sortBySortOrder = <TItem extends { sortOrder?: number | string | null }>(
  left: ReferenceOption<TItem>,
  right: ReferenceOption<TItem>,
) => Number(left.item.sortOrder ?? 0) - Number(right.item.sortOrder ?? 0) || sortByLabel(left, right);

const sortByValue = <TItem>(left: ReferenceOption<TItem>, right: ReferenceOption<TItem>) =>
  left.value.localeCompare(right.value) || sortByLabel(left, right);

export type CommonCodeReferenceSort = "label" | "level2Code" | "level3Code" | "sortOrder";

const commonCodeSort = (sort: CommonCodeReferenceSort) => {
  if (sort === "label") {
    return sortByLabel<CommonCodeRecord>;
  }
  if (sort === "level2Code" || sort === "level3Code") {
    return sortByValue<CommonCodeRecord>;
  }
  return sortBySortOrder<CommonCodeRecord>;
};

const toResult = <TItem>(
  items: TItem[],
  mapOption: (item: TItem) => Omit<ReferenceOption<TItem>, "item">,
  sortOptions: (left: ReferenceOption<TItem>, right: ReferenceOption<TItem>) => number = sortByLabel,
): ReferenceQueryResult<TItem> => {
  const optionMap = new Map<string, ReferenceOption<TItem>>();

  items
    .map((item) => ({ item, ...mapOption(item) }))
    .filter((option) => option.value)
    .sort(sortOptions)
    .forEach((option) => {
      if (!optionMap.has(option.value)) {
        optionMap.set(option.value, option);
      }
    });

  const options = [...optionMap.values()];
  return {
    items,
    labelByValue: Object.fromEntries(options.map((option) => [option.value, option.label])),
    options,
  };
};

export async function getRoleReferences(params: SystemRoleSearchParams = { useYn: true }) {
  const items = await listSystemRoles(params);
  return toResult<SystemRoleRecord>(
    items,
    (role) => ({ label: role.roleName, value: role.roleCode }),
    sortBySortSeq,
  );
}

export async function getUserReferences(params: UserReferenceSearchParams = {}) {
  const page = await getUsers({
    deptCode: params.deptCode ?? "All",
    groupCode: params.groupCode ?? "All",
    keyword: params.keyword ?? "",
    page: params.page ?? 0,
    size: params.size ?? DEFAULT_REFERENCE_USER_SIZE,
    useYn: params.useYn ?? "Y",
  });

  return toResult<AuthUserAccount>(
    page.content,
    (user) => ({
      label: user.userName ? `${user.userName} (${user.loginId})` : user.loginId,
      value: user.employeeNo,
    }),
    sortByLabel,
  );
}

export async function getClientReferences(params: ClientReferenceSearchParams = {}) {
  const page = await listClientCodes({
    businessName: params.businessName ?? "",
    companyType: params.companyType ?? "All",
    orderClass: params.orderClass ?? "All",
    page: params.page ?? 0,
    size: params.size ?? DEFAULT_REFERENCE_CLIENT_SIZE,
  });

  return toResult<ClientCodeRecord>(
    page.content,
    (client) => ({
      label: client.orderNameLong?.trim() ? `${client.orderName} (${client.orderNameLong})` : client.orderName,
      value: client.clientCode,
    }),
    sortByLabel,
  );
}

export async function getDepartmentReferences(params: DepartmentSearchParams = { useYn: true }) {
  const items = await listDepartments(params);
  return toResult<DepartmentRecord>(
    items,
    (department) => ({ label: department.deptName, value: department.deptCode }),
    sortBySortSeq,
  );
}

const constructionTypeValue = (item: ConstructionTypeRecord) => {
  if (item.codeLevel === 3) {
    return item.level3Code;
  }
  if (item.codeLevel === 2) {
    return item.level2Code;
  }
  return item.level1Code;
};

export async function getConstructionTypeReferences(params: ConstructionTypeSearchParams = { useYn: "Y" }) {
  const items = await listConstructionTypes(params);
  return toResult<ConstructionTypeRecord>(
    items,
    (type) => ({ label: type.codeName, value: constructionTypeValue(type) }),
    (left, right) =>
      left.item.codeLevel - right.item.codeLevel ||
      left.value.localeCompare(right.value) ||
      left.label.localeCompare(right.label),
  );
}

export async function getCommonCodeLevel1References(params: CommonCodeSearchParams = { useYn: "Y" }) {
  const items = (await listCommonCodes(params)).filter((code) => code.codeLevel === 1);
  return toResult<CommonCodeRecord>(
    items,
    (code) => ({ label: code.codeName, value: code.level2Code }),
    sortBySortOrder,
  );
}

export async function getCommonCodeLevel2References(
  level1Code: string,
  params: Omit<CommonCodeSearchParams, "level1Code"> = { useYn: "Y" },
  sort: CommonCodeReferenceSort = "sortOrder",
) {
  const items = (await listCommonCodes({ ...params, level1Code })).filter((code) => code.codeLevel === 2);
  return toResult<CommonCodeRecord>(
    items,
    (code) => ({ label: code.codeName, value: code.level2Code }),
    commonCodeSort(sort),
  );
}

export async function getCommonCodeLevel3References(
  level1Code: string,
  level2Code: string,
  params: Omit<CommonCodeSearchParams, "level1Code" | "level2Code"> = { useYn: "Y" },
  sort: CommonCodeReferenceSort = "sortOrder",
) {
  const items = (await listCommonCodes({ ...params, level1Code, level2Code })).filter((code) => code.codeLevel === 3);
  return toResult<CommonCodeRecord>(
    items,
    (code) => ({ label: code.codeDetailName || code.codeName, value: code.level3Code }),
    commonCodeSort(sort),
  );
}
