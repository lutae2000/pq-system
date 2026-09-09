import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const appTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    background: {
      default: "#f7f9fc",
      paper: "#ffffff",
    },
    primary: {
      main: "#2563eb",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f766e",
    },
    error: {
      main: "#dc2626",
    },
    warning: {
      main: "#d97706",
    },
    success: {
      main: "#16a34a",
    },
    text: {
      primary: "#111827",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
    h4: { fontWeight: 900, letterSpacing: 0 },
    h5: { fontWeight: 800, letterSpacing: 0 },
    h6: { fontWeight: 800, letterSpacing: 0 },
    button: { fontWeight: 800, textTransform: "none", letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          "&:last-child": {
            paddingBottom: 10,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 34,
          "& .MuiOutlinedInput-input": {
            paddingBottom: 6,
            paddingTop: 6,
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderColor: "#e2e8f0",
          backgroundColor: "#ffffff",
        },
      },
    },
  },
});
