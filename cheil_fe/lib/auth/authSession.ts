export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt?: string | null;
  employeeNo: string;
  issuedAt: string;
  loginId: string;
  deptCode?: string | null;
  idleTimeoutMinutes?: number | null;
  permissions?: MenuPermission[];
  sessionExpiresAt?: string | null;
  sessionTimeoutMinutes?: number | null;
  userName: string;
};

export type MenuPermission = {
  createYn: boolean;
  deleteYn: boolean;
  menuCode: string;
  menuName: string;
  menuPath?: string | null;
  menuType: string;
  parentMenuCode?: string | null;
  readYn: boolean;
  sortSeq: number;
  updateYn: boolean;
  useYn: boolean;
  visibleYn: boolean;
};

export const AUTH_SESSION_STORAGE_KEY = "cheil-pq-auth-session";
export const AUTH_NOTICE_STORAGE_KEY = "cheil-pq-auth-notice";
export const AUTH_SESSION_CHANGE_EVENT = "cheil-pq-auth-session-change";

const normalizeBooleanEnv = (value: string | undefined) => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return !["false", "0", "off"].includes(normalized);
};

export const ROUTE_GUARD_ENABLED = normalizeBooleanEnv(process.env.NEXT_PUBLIC_ROUTE_GUARD_ENABLED);

const isBrowser = () => typeof window !== "undefined";

const parseSession = (value: string | null): AuthSession | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    return null;
  }
};

const isExpired = (session: AuthSession) => {
  const expiresAtValue = session.accessTokenExpiresAt ?? session.sessionExpiresAt;
  if (!expiresAtValue) {
    return false;
  }

  const expiresAt = new Date(expiresAtValue).getTime();
  if (Number.isNaN(expiresAt)) {
    return false;
  }

  return Date.now() >= expiresAt;
};

export const readAuthSessionSnapshot = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  return parseSession(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY));
};

export const getAuthSessionStorageSnapshot = () =>
  isBrowser() ? window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? "" : "";

export const subscribeAuthSession = (onStoreChange: () => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_SESSION_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, onStoreChange);
  };
};

export const readAuthSession = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  const session = readAuthSessionSnapshot();
  if (!session) {
    return null;
  }

  if (isExpired(session)) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }

  return session;
};

export const hasAuthSession = () => readAuthSession() !== null;

export const writeAuthSession = (session: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
};

export const redirectToLogin = (path = "/login") => {
  if (!isBrowser()) {
    return;
  }

  const target = path.startsWith("/") ? path : `/${path}`;

  try {
    if (window.top && window.top !== window) {
      window.top.location.replace(target);
      return;
    }
  } catch {
    // Fall back to the current browsing context when the top window cannot be accessed.
  }

  window.location.replace(target);
};

export const writeAuthNotice = (message: string) => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
};

export const consumeAuthNotice = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const message = window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
  return message;
};
