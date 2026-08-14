"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { PageHeader } from "@/components/common/PageHeader";
import { getReadableMenuGroupsByRootPath } from "@/shared/navigation/menuPermissionUtils";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";

export function PqManagementPage() {
  const permissions = useSessionMenuPermissions();
  const menuGroups = getReadableMenuGroupsByRootPath("/pq", permissions);

  return (
    <Box>
      <PageHeader
        title="PQ관리"
        description="기준정보, 기술인, 회사실적, 문서관리를 한 화면에서 접근할 수 있도록 구성합니다."
      />

      <Stack spacing={2}>
        {menuGroups.map(({ group, children }) => (
          <Card key={group.menuCode}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  {group.menuName}
                </Typography>
                <Chip label={`${children.length}개 메뉴`} size="small" variant="outlined" />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                {children.map((permission) => (
                  <Button key={permission.menuCode} component={Link} href={permission.menuPath ?? "/pq"} variant="outlined">
                    {permission.menuName}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
