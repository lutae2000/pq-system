import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";
import type { AuthUserAccount } from "@/types/user";

const USERS_API = "/auth/users";
export const USER_PAGE_SIZE = 20;

type UserAccountResponse = Omit<AuthUserAccount, "userPassword">;

export type UserSearchParams = {
  deptCode: string;
  groupCode: string;
  keyword: string;
  page: number;
  size?: number;
  useYn: "All" | "Y" | "N";
};

export type UserPageResponse = {
  content: AuthUserAccount[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();

const normalizeUser = (user: Partial<AuthUserAccount> & { userPassword?: string | null }): AuthUserAccount => ({
  deptCode: normalizeText(user.deptCode),
  email: normalizeText(user.email),
  employeeNo: normalizeText(user.employeeNo),
  groupCode: normalizeText(user.groupCode),
  lastChngDt: normalizeText(user.lastChngDt),
  lastChngUser: normalizeText(user.lastChngUser),
  loginDt: normalizeText(user.loginDt),
  loginId: normalizeText(user.loginId),
  logoutDt: normalizeText(user.logoutDt),
  picYn: user.picYn === "Y" ? "Y" : "N",
  passwordReset: Boolean(user.passwordReset),
  passwordResetDt: normalizeText(user.passwordResetDt),
  recentIpAddr: normalizeText(user.recentIpAddr),
  userPassword: normalizeText(user.userPassword),
  userName: normalizeText(user.userName),
  useYn: Boolean(user.useYn),
  wrongPasswordCount: Number.isFinite(user.wrongPasswordCount)
    ? Math.max(0, Math.trunc(user.wrongPasswordCount ?? 0))
    : 0,
});

const buildSearchParams = (params: UserSearchParams) => {
  const searchParams = new URLSearchParams();

  if (params.keyword.trim()) searchParams.set("keyword", params.keyword.trim());
  if (params.useYn !== "All") searchParams.set("useYn", params.useYn);
  if (params.groupCode !== "All") searchParams.set("groupCode", params.groupCode);
  if (params.deptCode !== "All") searchParams.set("deptCode", params.deptCode);
  searchParams.set("page", String(Math.max(0, Math.trunc(params.page))));
  searchParams.set("size", String(Math.max(1, Math.trunc(params.size ?? USER_PAGE_SIZE))));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};


export async function getUsers(params: UserSearchParams): Promise<UserPageResponse> {
  const response = await apiRequest<{
    content: UserAccountResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(
    apiClient.get(`${USERS_API}${buildSearchParams(params)}`),
    "사용자 계정 목록을 불러오지 못했습니다.",
  );

  return {
    content: response.content.map((user) => normalizeUser({ ...user, userPassword: "" })),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

export async function getUser(employeeNo: string): Promise<AuthUserAccount> {
  const user = await apiRequest<UserAccountResponse>(
    apiClient.get(`${USERS_API}/${encodeURIComponent(employeeNo)}`),
    "사용자 계정을 불러오지 못했습니다.",
  );

  return normalizeUser({ ...user, userPassword: "" });
}

export async function saveUser(user: AuthUserAccount): Promise<AuthUserAccount> {
  const saved = await apiRequest<UserAccountResponse>(
    apiClient.post(USERS_API, user),
    "사용자 계정을 저장하지 못했습니다.",
  );

  return normalizeUser({ ...saved, userPassword: "" });
}

export async function resetUserPassword(employeeNo: string): Promise<AuthUserAccount> {
  const saved = await apiRequest<UserAccountResponse>(
    apiClient.post(`${USERS_API}/${encodeURIComponent(employeeNo)}/password-reset`),
    "비밀번호를 초기화하지 못했습니다.",
  );

  return normalizeUser({ ...saved, userPassword: "" });
}
