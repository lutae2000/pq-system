import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type CommonCodeLevel = 1 | 2 | 3;

export type CommonCodeRecord = {
  codeId: number;
  codeLevel: CommonCodeLevel;
  level1Code: string;
  level2Code: string;
  level3Code: string;
  codeName: string;
  codeDetailName: string | null;
  refValue1: string | null;
  sortOrder: number | null;
  remark: string | null;
  useYn: boolean;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type CommonCodeSearchParams = {
  codeLevel?: CommonCodeLevel | "All";
  level1Code?: string;
  level2Code?: string;
  level2CodePrefix?: string;
  level3Code?: string;
  refValue1Contains?: string;
  sort?: "default" | "level3Code";
  keyword?: string;
  useYn?: "All" | "Y" | "N";
};

export type CommonCodeUpsertRequest = {
  codeLevel: CommonCodeLevel;
  level1Code: string;
  level2Code?: string | null;
  level3Code?: string | null;
  codeName: string;
  codeDetailName?: string | null;
  refValue1?: string | null;
  sortOrder?: number | null;
  remark?: string | null;
  useYn: boolean;
  createdId?: string | null;
  lastChangedId?: string | null;
};

const normalizeQueryValue = (value: string | number | boolean | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};

export async function listCommonCodes(params: CommonCodeSearchParams = {}): Promise<CommonCodeRecord[]> {
  const codeLevel = params.codeLevel && params.codeLevel !== "All" ? params.codeLevel : undefined;

  return apiRequest(
    apiClient.get<CommonCodeRecord[]>("/code/common-codes", {
      params: {
        codeLevel: normalizeQueryValue(codeLevel),
        level1Code: normalizeQueryValue(params.level1Code?.trim()),
        level2Code: normalizeQueryValue(params.level2Code?.trim()),
        level2CodePrefix: normalizeQueryValue(params.level2CodePrefix?.trim()),
        level3Code: params.level3Code === undefined || params.level3Code === null ? undefined : params.level3Code.trim(),
        refValue1Contains: normalizeQueryValue(params.refValue1Contains?.trim()),
        sort: params.sort === "level3Code" ? params.sort : undefined,
        keyword: normalizeQueryValue(params.keyword?.trim()),
        useYn: params.useYn && params.useYn !== "All" ? params.useYn === "Y" : undefined,
      },
    }),
    "공통코드 목록을 불러오지 못했습니다.",
  );
}

export async function createCommonCode(requestBody: CommonCodeUpsertRequest): Promise<CommonCodeRecord> {
  return apiRequest(apiClient.post<CommonCodeRecord>("/code/common-codes", requestBody), "공통코드를 저장하지 못했습니다.");
}

export async function updateCommonCode(codeId: number, requestBody: CommonCodeUpsertRequest): Promise<CommonCodeRecord> {
  return apiRequest(
    apiClient.put<CommonCodeRecord>(`/code/common-codes/${encodeURIComponent(String(codeId))}`, requestBody),
    "공통코드를 저장하지 못했습니다.",
  );
}

export async function deleteCommonCode(codeId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`/code/common-codes/${encodeURIComponent(String(codeId))}`),
    "공통코드를 삭제하지 못했습니다.",
  );
}
