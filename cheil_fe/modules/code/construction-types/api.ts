import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type ConstructionTypeLevel = 1 | 2 | 3;

export type ConstructionTypeRecord = {
  codeId: number;
  codeLevel: ConstructionTypeLevel;
  codeName: string;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
  level1Code: string;
  level2Code: string;
  level3Code: string;
  useYn: boolean;
};

export type ConstructionTypeSearchParams = {
  codeLevel?: ConstructionTypeLevel | "All";
  keyword?: string;
  level1Code?: string;
  level2Code?: string;
  useYn?: "All" | "Y" | "N";
};

export type ConstructionTypeUpsertRequest = {
  codeLevel: ConstructionTypeLevel;
  codeName: string;
  createdId?: string | null;
  lastChangedId?: string | null;
  level1Code: string;
  level2Code?: string | null;
  level3Code?: string | null;
  useYn: boolean;
};

const normalizeQueryValue = (value: string | number | boolean | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
};


export async function listConstructionTypes(params: ConstructionTypeSearchParams = {}): Promise<ConstructionTypeRecord[]> {
  const codeLevel =
    params.codeLevel && params.codeLevel !== "All" ? params.codeLevel : undefined;

  return apiRequest(
    apiClient.get<ConstructionTypeRecord[]>("/code/construction-types", {
      params: {
        codeLevel: normalizeQueryValue(codeLevel),
        keyword: normalizeQueryValue(params.keyword?.trim()),
        level1Code: normalizeQueryValue(params.level1Code?.trim()),
        level2Code: normalizeQueryValue(params.level2Code?.trim()),
        useYn: params.useYn && params.useYn !== "All" ? params.useYn === "Y" : undefined,
      },
    }),
    "공사종류 목록을 불러오지 못했습니다.",
  );
}

export async function getConstructionType(codeId: number): Promise<ConstructionTypeRecord> {
  return apiRequest(
    apiClient.get<ConstructionTypeRecord>(`/code/construction-types/${encodeURIComponent(String(codeId))}`),
    "공사종류를 불러오지 못했습니다.",
  );
}

export async function createConstructionType(requestBody: ConstructionTypeUpsertRequest): Promise<ConstructionTypeRecord> {
  return apiRequest(apiClient.post<ConstructionTypeRecord>("/code/construction-types", requestBody), "공사종류를 저장하지 못했습니다.");
}

export async function updateConstructionType(
  codeId: number,
  requestBody: ConstructionTypeUpsertRequest,
): Promise<ConstructionTypeRecord> {
  return apiRequest(
    apiClient.put<ConstructionTypeRecord>(`/code/construction-types/${encodeURIComponent(String(codeId))}`, requestBody),
    "공사종류를 저장하지 못했습니다.",
  );
}

export async function deleteConstructionType(codeId: number): Promise<void> {
  await apiRequest(
    apiClient.delete(`/code/construction-types/${encodeURIComponent(String(codeId))}`),
    "공사종류를 삭제하지 못했습니다.",
  );
}
