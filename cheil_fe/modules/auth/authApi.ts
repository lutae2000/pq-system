import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";
import type { MenuPermission } from "@/lib/auth/authSession";

export type LoginRequest = {
  loginId: string;
  userPassword: string;
};

export type LoginResponse = {
  deptCode: string;
  employeeNo: string;
  groupCode: string;
  loginDt: string | null;
  loginId: string;
  recentIpAddr: string | null;
  passwordReset: boolean;
  token: {
    accessToken: string;
    expiresAt?: string | null;
    tokenType: string;
  };
  session: {
    expiresAt?: string | null;
    id?: string | null;
    idleTimeoutMinutes?: number | null;
    timeoutMinutes?: number | null;
  };
  useYn: boolean;
  userName: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type MyAccountResponse = {
  deptCode: string;
  employeeNo: string;
  email: string | null;
  groupCode: string;
  loginId: string;
  passwordResetDt: string | null;
  userName: string;
};

export type MyAccountUpdateRequest = {
  employeeNo: string;
  deptCode: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
};

export type SignupRequest = {
  employeeNo: string;
  userName: string;
  loginId: string;
  userPassword: string;
  deptCode: string;
  groupCode: string;
};

export type SignupResponse = {
  deptCode: string;
  employeeNo: string;
  groupCode: string;
  loginId: string;
  useYn: boolean;
  userName: string;
};

export type MenuPermissionResponse = MenuPermission;

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiRequest(
    apiClient.post<LoginResponse>("/auth/login", {
      loginId: request.loginId,
      userPassword: request.userPassword,
    }),
    "로그인 요청에 실패했습니다.",
  );
}

export async function listMyMenuPermissions(): Promise<MenuPermissionResponse[]> {
  return apiRequest(
    apiClient.get<MenuPermissionResponse[]>("/auth/menu-permissions"),
    "메뉴 권한 조회에 실패했습니다.",
  );
}

export async function getMyAccount(): Promise<MyAccountResponse> {
  return apiRequest(apiClient.get<MyAccountResponse>("/auth/me"), "내 계정 정보를 불러오지 못했습니다.");
}

export async function updateMyAccount(request: MyAccountUpdateRequest): Promise<MyAccountResponse> {
  return apiRequest(
    apiClient.patch<MyAccountResponse>("/auth/me", request),
    "내 계정 정보를 저장하지 못했습니다.",
  );
}

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  return apiRequest(
    apiClient.post<SignupResponse>("/auth/signup", {
      deptCode: request.deptCode,
      employeeNo: request.employeeNo,
      groupCode: request.groupCode,
      loginId: request.loginId,
      userName: request.userName,
      userPassword: request.userPassword,
    }),
    "회원가입 요청에 실패했습니다.",
  );
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await apiRequest(
    apiClient.patch("/auth/password", {
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
    }),
    "비밀번호를 변경하지 못했습니다.",
  );
}
