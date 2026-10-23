"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export type DetailSectionCardProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
};

export function DetailSectionCard({ action, children, description, title }: DetailSectionCardProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        boxShadow: "0 1px 1px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "rgba(15, 23, 42, 0.04)",
          borderBottom: "1px solid",
          borderBottomColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          minHeight: 36,
          px: 1.25,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 800 }} variant="subtitle1">
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: 1 }}>
        {description ? (
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
            {description}
          </Typography>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}
