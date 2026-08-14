"use client";

import { Box, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";

export type DetailFormSectionProps = {
  actions?: ReactNode;
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  description?: string;
  title: string;
};

export function DetailFormSection({ actions, children, columns = 2, description, title }: DetailFormSectionProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between", mb: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
            {title}
          </Typography>
          {description ? (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions}
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
            lg: `repeat(${columns}, minmax(0, 1fr))`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
