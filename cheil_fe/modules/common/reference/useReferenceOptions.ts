"use client";

import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";

import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import {
  getClientReferences,
  getCommonCodeLevel1References,
  getCommonCodeLevel2References,
  getCommonCodeLevel3References,
  getConstructionTypeReferences,
  getDepartmentReferences,
  getRoleReferences,
  getUserReferences,
  type CommonCodeReferenceSort,
  type ClientReferenceSearchParams,
  type ReferenceQueryResult,
  type UserReferenceSearchParams,
} from "@/modules/common/reference/referenceApi";
import type { CommonCodeRecord, CommonCodeSearchParams } from "@/modules/code/common-codes/api";
import type { ClientCodeRecord } from "@/modules/code/clients/api";
import type { ConstructionTypeRecord, ConstructionTypeSearchParams } from "@/modules/code/construction-types/api";
import type { DepartmentRecord, DepartmentSearchParams } from "@/modules/code/departments/api";
import type { SystemRoleRecord, SystemRoleSearchParams } from "@/modules/system/roles/api";
import type { AuthUserAccount } from "@/types/user";

export const REFERENCE_STALE_TIME = 5 * 60 * 1000;

type ReferenceQueryOptions<TItem> = Omit<
  UseQueryOptions<ReferenceQueryResult<TItem>, Error, ReferenceQueryResult<TItem>, QueryKey>,
  "queryFn" | "queryKey" | "staleTime"
>;

const emptyReferenceResult = <TItem>(): ReferenceQueryResult<TItem> => ({
  items: [],
  labelByValue: {},
  options: [],
});

function useReferenceQuery<TItem>(
  queryKey: QueryKey,
  queryFn: () => Promise<ReferenceQueryResult<TItem>>,
  options?: ReferenceQueryOptions<TItem>,
) {
  const enabled = useTabQueryEnabled(options?.enabled ?? true);
  const query = useQuery({
    staleTime: REFERENCE_STALE_TIME,
    ...options,
    enabled,
    queryKey,
    queryFn,
  });

  return {
    ...query,
    ...(query.data ?? emptyReferenceResult<TItem>()),
  };
}

export function useRoleOptions(params: SystemRoleSearchParams = { useYn: true }, options?: ReferenceQueryOptions<SystemRoleRecord>) {
  return useReferenceQuery(["references", "roles", params], () => getRoleReferences(params), options);
}

export function useUserOptions(params: UserReferenceSearchParams = {}, options?: ReferenceQueryOptions<AuthUserAccount>) {
  return useReferenceQuery(["references", "users", params], () => getUserReferences(params), options);
}

export function useClientOptions(params: ClientReferenceSearchParams = {}, options?: ReferenceQueryOptions<ClientCodeRecord>) {
  return useReferenceQuery(["references", "clients", params], () => getClientReferences(params), options);
}

export function useDepartmentOptions(params: DepartmentSearchParams = { useYn: true }, options?: ReferenceQueryOptions<DepartmentRecord>) {
  return useReferenceQuery(["references", "departments", params], () => getDepartmentReferences(params), options);
}

export function useConstructionTypeOptions(
  params: ConstructionTypeSearchParams = { useYn: "Y" },
  options?: ReferenceQueryOptions<ConstructionTypeRecord>,
) {
  return useReferenceQuery(["references", "construction-types", params], () => getConstructionTypeReferences(params), options);
}

export function useCommonCodeLevel1Options(
  params: CommonCodeSearchParams = { useYn: "Y" },
  options?: ReferenceQueryOptions<CommonCodeRecord>,
) {
  return useReferenceQuery(["references", "common-codes", "level1", params], () => getCommonCodeLevel1References(params), options);
}

export function useCommonCodeLevel2Options(
  level1Code: string,
  params: Omit<CommonCodeSearchParams, "level1Code"> = { useYn: "Y" },
  options?: ReferenceQueryOptions<CommonCodeRecord>,
  sort: CommonCodeReferenceSort = "sortOrder",
) {
  return useReferenceQuery(
    ["references", "common-codes", "level2", level1Code, params, sort],
    () => getCommonCodeLevel2References(level1Code, params, sort),
    { enabled: Boolean(level1Code), ...options },
  );
}

export function useCommonCodeLevel3Options(
  level1Code: string,
  level2Code: string,
  params: Omit<CommonCodeSearchParams, "level1Code" | "level2Code"> = { useYn: "Y" },
  options?: ReferenceQueryOptions<CommonCodeRecord>,
  sort: CommonCodeReferenceSort = "sortOrder",
) {
  return useReferenceQuery(
    ["references", "common-codes", "level3", level1Code, level2Code, params, sort],
    () => getCommonCodeLevel3References(level1Code, level2Code, params, sort),
    { enabled: Boolean(level1Code && level2Code), ...options },
  );
}
