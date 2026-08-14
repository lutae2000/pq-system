"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { KeyboardEvent, PointerEvent } from "react";

type ResizeHandleProps = {
  ariaLabel: string;
  orientation: "horizontal" | "vertical";
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  sx?: SxProps<Theme>;
};

export function ResizeHandle({ ariaLabel, orientation, onKeyDown, onPointerDown, sx }: ResizeHandleProps) {
  const vertical = orientation === "vertical";

  return (
    <Box
      aria-label={ariaLabel}
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      role="separator"
      sx={[
        {
          alignItems: "center",
          bgcolor: "transparent",
          cursor: vertical ? "col-resize" : "row-resize",
          display: { xs: "none", xl: "flex" },
          justifyContent: "center",
          position: "absolute",
          touchAction: "none",
          zIndex: 2,
          ...(vertical
            ? {
                bottom: 0,
                right: -18,
                top: 0,
                width: 36,
              }
            : {
                bottom: -18,
                height: 36,
                left: 0,
                right: 0,
              }),
          "&::before": {
            bgcolor: "rgba(255, 255, 255, 0.92)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 999,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08), 0 8px 18px rgba(15, 23, 42, 0.08)",
            backdropFilter: "blur(6px)",
            content: '""',
            height: vertical ? 68 : 18,
            transition: "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
            width: vertical ? 18 : 68,
          },
          "&::after": {
            content: '""',
            height: vertical ? 34 : 4,
            opacity: 0.72,
            position: "absolute",
            width: vertical ? 3 : 34,
            backgroundImage: vertical
              ? "linear-gradient(to bottom, transparent 0, transparent 5px, currentColor 5px, currentColor 7px, transparent 7px, transparent 13px, currentColor 13px, currentColor 15px, transparent 15px, transparent 21px, currentColor 21px, currentColor 23px, transparent 23px, transparent 29px, currentColor 29px, currentColor 31px, transparent 31px, transparent 34px)"
              : "linear-gradient(to right, transparent 0, transparent 5px, currentColor 5px, currentColor 7px, transparent 7px, transparent 13px, currentColor 13px, currentColor 15px, transparent 15px, transparent 21px, currentColor 21px, currentColor 23px, transparent 23px, transparent 29px, currentColor 29px, currentColor 31px, transparent 31px, transparent 34px)",
            color: "text.secondary",
          },
          "&:hover::before, &:focus-visible::before": {
            bgcolor: "background.paper",
            borderColor: "primary.main",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.10), 0 10px 22px rgba(25, 118, 210, 0.18)",
            transform: "scale(1.04)",
          },
          "&:hover::after, &:focus-visible::after": {
            bgcolor: "primary.main",
            opacity: 1,
          },
          "&:hover": {
            bgcolor: "rgba(25, 118, 210, 0.04)",
          },
          "&:focus-visible": {
            outline: "none",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      tabIndex={0}
    />
  );
}
