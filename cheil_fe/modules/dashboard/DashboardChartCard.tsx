"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

type DashboardChartCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  headerGap?: number;
};

export function DashboardChartCard({ title, subtitle, action, children, headerGap = 2 }: DashboardChartCardProps) {
  const showHeader = Boolean(title || subtitle || action);

  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {showHeader ? (
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: headerGap }}>
            <Box>
              {title ? (
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
          </Box>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
