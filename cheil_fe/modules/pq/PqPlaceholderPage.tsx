import { Box, Card, CardContent, Typography } from "@mui/material";

import { PageHeader } from "@/components/common/PageHeader";

type PqPlaceholderPageProps = {
  description: string;
  title: string;
};

export function PqPlaceholderPage({ description, title }: PqPlaceholderPageProps) {
  return (
    <Box>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            화면 상세 기능을 준비 중입니다. 메뉴 경로와 권한 연결은 완료되어 있습니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
