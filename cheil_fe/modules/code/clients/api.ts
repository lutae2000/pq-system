import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

const CLIENT_CODES_API = "/code/client-codes";
export const CLIENT_CODE_PAGE_SIZE = 20;

export type ClientCodeRecord = {
  clientCode: string;
  orderName: string;
  orderEngName: string | null;
  businessNo: string | null;
  corpNo: string | null;
  orderNameLong: string | null;
  owner: string | null;
  businessSectors: string | null;
  businessItems: string | null;
  orderClass: string | null;
  zipCode: string | null;
  addr1: string | null;
  addr2: string | null;
  remark: string | null;
  companyType: string | null;
  homeUrl: string | null;
  otype: string | null;
  createdAt: string | null;
  createdId: string | null;
  lastChangedAt: string | null;
  lastChangedId: string | null;
};

export type ClientCodePageResponse = {
  content: ClientCodeRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};

export type ClientCodeSearchParams = {
  businessName: string;
  companyType: string;
  orderClass: string;
  page: number;
  size?: number;
};

export type ClientCodeUpsertRequest = Omit<ClientCodeRecord, "createdAt" | "lastChangedAt">;

const normalizeQueryValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "" || value === "All") {
    return undefined;
  }
  return value;
};

export async function listClientCodes(params: ClientCodeSearchParams): Promise<ClientCodePageResponse> {
  return apiRequest(
    apiClient.get<ClientCodePageResponse>(CLIENT_CODES_API, {
      params: {
        businessName: normalizeQueryValue(params.businessName.trim()),
        companyType: normalizeQueryValue(params.companyType),
        orderClass: normalizeQueryValue(params.orderClass),
        page: Math.max(0, Math.trunc(params.page)),
        size: params.size === undefined ? undefined : Math.max(1, Math.trunc(params.size)),
      },
    }),
    "嫄곕옒泥?紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??",
  );
}

export async function getClientCode(clientCode: string): Promise<ClientCodeRecord> {
  return apiRequest(
    apiClient.get<ClientCodeRecord>(`${CLIENT_CODES_API}/${encodeURIComponent(clientCode)}`),
    "嫄곕옒泥??뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??",
  );
}

export async function createClientCode(requestBody: ClientCodeUpsertRequest): Promise<ClientCodeRecord> {
  return apiRequest(apiClient.post<ClientCodeRecord>(CLIENT_CODES_API, requestBody), "嫄곕옒泥??뺣낫瑜???ν븯吏 紐삵뻽?듬땲??");
}

export async function updateClientCode(clientCode: string, requestBody: ClientCodeUpsertRequest): Promise<ClientCodeRecord> {
  return apiRequest(
    apiClient.put<ClientCodeRecord>(`${CLIENT_CODES_API}/${encodeURIComponent(clientCode)}`, requestBody),
    "嫄곕옒泥??뺣낫瑜???ν븯吏 紐삵뻽?듬땲??",
  );
}

export async function deleteClientCode(clientCode: string): Promise<void> {
  await apiRequest(apiClient.delete(`${CLIENT_CODES_API}/${encodeURIComponent(clientCode)}`), "嫄곕옒泥??뺣낫瑜???젣?섏? 紐삵뻽?듬땲??");
}
