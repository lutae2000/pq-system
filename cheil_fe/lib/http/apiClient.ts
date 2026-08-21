import axios, { AxiosHeaders, type AxiosError, type AxiosInstance } from "axios";

import { clearAuthSession, readAuthSessionSnapshot, redirectToLogin, writeAuthNotice } from "@/lib/auth/authSession";
import { apiTimeoutMs } from "@/lib/config/timeouts";

type ApiErrorBody = {
  detail?: string;
  error?: string;
  message?: string;
  title?: string;
};

const UNAUTHORIZED_NOTICE_MESSAGE = "세션이 종료되었습니다. 다시 로그인해 주세요.";

const buildDefaultHeaders = () => ({
  "Accept": "application/json",
  "Content-Type": "application/json",
});

const buildLoginHeaders = () => {
  const session = readAuthSessionSnapshot();

  if (!session?.loginId || !session.accessToken) {
    return {};
  }

  return {
    "Authorization": `Bearer ${session.accessToken}`,
    "x-login-id": session.loginId,
  };
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: apiTimeoutMs,
});

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  const defaultHeaders = buildDefaultHeaders();
  const explicitAuthorization = headers.get("Authorization");
  const explicitLoginId = headers.get("x-login-id");
  headers.set("Accept", defaultHeaders.Accept);
  if (config.data instanceof FormData) {
    headers.delete("Content-Type");
  } else {
    headers.set("Content-Type", defaultHeaders["Content-Type"]);
  }

  const loginHeaders = buildLoginHeaders();
  if (loginHeaders.Authorization) {
    headers.set("Authorization", loginHeaders.Authorization);
  } else if (!explicitAuthorization) {
    headers.delete("Authorization");
  }

  if (loginHeaders["x-login-id"]) {
    headers.set("x-login-id", loginHeaders["x-login-id"]);
  } else if (!explicitLoginId) {
    headers.delete("x-login-id");
  }

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      const message = extractErrorMessage(error.response.data, UNAUTHORIZED_NOTICE_MESSAGE);
      writeAuthNotice(message);
      clearAuthSession();
      redirectToLogin("/login");
    }

    return Promise.reject(error);
  },
);

const extractErrorMessage = (data: unknown, fallback: string) => {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const body = data as ApiErrorBody;
    return body.message ?? body.detail ?? body.error ?? body.title ?? fallback;
  }

  return fallback;
};

export const toApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    return extractErrorMessage(axiosError.response?.data, fallback);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export async function logoutSession(): Promise<void> {
  const session = readAuthSessionSnapshot();
  clearAuthSession();

  try {
    if (session?.accessToken) {
      await apiClient.post(
        "/auth/logout",
        undefined,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
    }
  } catch {
    // Ignore logout failures and clear the local session regardless.
  } finally {
    clearAuthSession();
  }
}
