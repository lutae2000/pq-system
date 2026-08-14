"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent } from "@mui/material";

import { PageHeader } from "@/components/common/PageHeader";
import { getReadableMenuPagesByRootPath } from "@/shared/navigation/menuPermissionUtils";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";

export function CodeManagementPage() {
  const permissions = useSessionMenuPermissions();
  const menuPages = getReadableMenuPagesByRootPath("/code", permissions);

  return (
    <Box>
      <PageHeader
        title="코드 관리"
        description="사업소, 본부, 공통코드, 거래처 등 기준 코드 관리 메뉴로 이동합니다."
      />
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {menuPages.map((permission) => (
              <Button
                key={permission.menuCode}
                component={Link}
                href={permission.menuPath ?? "/code"}
                variant="outlined"
              >
                {permission.menuName}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
