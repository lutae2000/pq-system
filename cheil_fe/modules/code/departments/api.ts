import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type DepartmentRecord = {
  chgDate: string | null;
  chgDutyId: string | null;
  costDept: string | null;
  deptCode: string;
  deptDiv: string;
  deptName: string;
  headquarterCode: string;
  inputDate: string | null;
  inputDutyId: string | null;
  mhYn: boolean;
  projDiv: string;
  sortSeq: string;
  terminateDate: string | null;
  useYn: boolean;
};

export type DepartmentSearchParams = {
  costDept?: string;
  deptDiv?: string;
  keyword?: string;
  headquarterCode?: string;
  mhYn?: boolean | null;
  projDiv?: string;
  useYn?: boolean | null;
};

export type DepartmentUpsertRequest = {
  costDept?: string | null;
  deptCode: string;
  deptDiv: string;
  deptName: string;
  headquarterCode: string;
  inputDutyId?: string | null;
  mhYn: boolean;
  projDiv: string;
  sortSeq: string;
  terminateDate?: string | null;
  useYn: boolean;
  chgDutyId?: string | null;
};

const normalizeQueryValue = (value: string | boolean | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

export async function listDepartments(params: DepartmentSearchParams = {}) {
  return apiRequest(
    apiClient.get<DepartmentRecord[]>("/code/department", {
      params: {
        deptDiv: normalizeQueryValue(params.deptDiv),
        keyword: normalizeQueryValue(params.keyword),
        useYn: normalizeQueryValue(params.useYn),
      },
    }),
    "부서 목록을 불러오지 못했습니다.",
  );
}

export async function getDepartment(deptCode: string) {
  return apiRequest(
    apiClient.get<DepartmentRecord>(`/code/department/${encodeURIComponent(deptCode)}`),
    "부서 정보를 불러오지 못했습니다.",
  );
}

export async function createDepartment(request: DepartmentUpsertRequest) {
  return apiRequest(apiClient.post<DepartmentRecord>("/code/department", request), "부서를 저장하지 못했습니다.");
}

export async function updateDepartment(deptCode: string, request: DepartmentUpsertRequest) {
  return apiRequest(
    apiClient.put<DepartmentRecord>(`/code/department/${encodeURIComponent(deptCode)}`, request),
    "부서를 저장하지 못했습니다.",
  );
}
