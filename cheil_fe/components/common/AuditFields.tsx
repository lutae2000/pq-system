"use client";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";

export type AuditFieldsProps = {
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

const formatText = (value: string | null | undefined) => (value && value.trim() ? value : "-");

const formatDateTime = (value: string | null | undefined) => {
  const text = formatText(value);
  if (text === "-") {
    return text;
  }

  const normalized = text.replace(/[T]/g, " ").replace(/\.\d+Z?$/, "");
  const match = normalized.match(/^(\d{4})-?(\d{2})-?(\d{2})[ T](\d{2}):?(\d{2})(?::?(\d{2}))?/);
  if (!match) {
    return text;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

function AuditFieldCard({
  icon,
  label,
  value,
  variant = "text",
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
  variant?: "text" | "datetime";
}) {
  const resolvedValue = variant === "datetime" ? formatDateTime(value) : formatText(value);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.25,
        minWidth: 0,
        p: 1.25,
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "50%",
            color: "primary.main",
            display: "inline-flex",
            flex: "0 0 auto",
            height: 32,
            justifyContent: "center",
            width: 32,
            "& .MuiSvgIcon-root": { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1.25 }} />

      <Typography
        sx={{
          color: "text.primary",
          fontFamily: variant === "datetime" ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : "inherit",
          fontSize: variant === "datetime" ? 13.5 : 14,
          fontWeight: 800,
          lineHeight: 1.35,
          minHeight: 22,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {resolvedValue}
      </Typography>
    </Box>
  );
}

export function AuditFields({ createdAt, createdBy, updatedAt, updatedBy }: AuditFieldsProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1.25, mt: 1.5 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
            변경 이력
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          <AuditFieldCard icon={<PersonOutlineOutlinedIcon />} label="등록자" value={createdBy} />
          <AuditFieldCard icon={<AccessTimeOutlinedIcon />} label="등록일시" value={createdAt} variant="datetime" />
          <AuditFieldCard icon={<EditOutlinedIcon />} label="수정자" value={updatedBy} />
          <AuditFieldCard icon={<AccessTimeOutlinedIcon />} label="수정일시" value={updatedAt} variant="datetime" />
        </Box>
      </CardContent>
    </Card>
  );
}
