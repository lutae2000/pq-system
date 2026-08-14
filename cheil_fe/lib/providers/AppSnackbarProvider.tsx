"use client";

import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AppSnackbarSeverity = "success" | "error" | "warning" | "info";

export type AppSnackbarOptions = {
  autoHideDuration?: number;
  message: string;
  severity?: AppSnackbarSeverity;
};

type AppSnackbarState = AppSnackbarOptions & {
  id: number;
};

type AppSnackbarContextValue = {
  hideSnackbar: () => void;
  showError: (message: string, autoHideDuration?: number) => void;
  showInfo: (message: string, autoHideDuration?: number) => void;
  showSnackbar: (options: AppSnackbarOptions) => void;
  showSuccess: (message: string, autoHideDuration?: number) => void;
  showWarning: (message: string, autoHideDuration?: number) => void;
};

const AppSnackbarContext = createContext<AppSnackbarContextValue | null>(null);

const DEFAULT_AUTO_HIDE_DURATION = 3000;

export function AppSnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<AppSnackbarState | null>(null);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const showSnackbar = useCallback((options: AppSnackbarOptions) => {
    setSnackbar({
      autoHideDuration: options.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION,
      id: Date.now(),
      message: options.message,
      severity: options.severity ?? "info",
    });
  }, []);

  const value = useMemo<AppSnackbarContextValue>(
    () => ({
      hideSnackbar,
      showError: (message, autoHideDuration) => showSnackbar({ autoHideDuration, message, severity: "error" }),
      showInfo: (message, autoHideDuration) => showSnackbar({ autoHideDuration, message, severity: "info" }),
      showSnackbar,
      showSuccess: (message, autoHideDuration) => showSnackbar({ autoHideDuration, message, severity: "success" }),
      showWarning: (message, autoHideDuration) => showSnackbar({ autoHideDuration, message, severity: "warning" }),
    }),
    [hideSnackbar, showSnackbar],
  );

  return (
    <AppSnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={snackbar?.id ?? "app-snackbar"}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={snackbar?.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION}
        onClose={hideSnackbar}
        open={Boolean(snackbar)}
      >
        <Alert onClose={hideSnackbar} severity={snackbar?.severity ?? "info"} sx={{ width: "100%" }} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </AppSnackbarContext.Provider>
  );
}

export function useAppSnackbar() {
  const context = useContext(AppSnackbarContext);

  if (!context) {
    throw new Error("useAppSnackbar must be used within AppSnackbarProvider");
  }

  return context;
}
