"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { PageHeader } from "@/components/common/PageHeader";
import { getReadableMenuPagesByRootPath } from "@/shared/navigation/menuPermissionUtils";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";

export function SystemMenuPage() {
  const permissions = useSessionMenuPermissions();
  const menuPages = getReadableMenuPagesByRootPath("/system", permissions);

  return (
    <Box>
      <PageHeader title="권한 관리" />

      <Stack spacing={2}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                권한 관리 메뉴
              </Typography>
              <Chip label={`${menuPages.length}개 화면`} size="small" variant="outlined" />
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
              {menuPages.map((permission) => (
                <Button
                  key={permission.menuCode}
                  component={Link}
                  href={permission.menuPath ?? "/system"}
                  variant="outlined"
                >
                  {permission.menuName}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>ㄱ
      </Stack>
    </Box>
  );
}
