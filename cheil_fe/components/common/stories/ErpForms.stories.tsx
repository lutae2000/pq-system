import { Box, Stack, TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { AuditFields } from "../AuditFields";
import { CodeSelectField } from "../CodeSelectField";
import { DateRangeField } from "../DateRangeField";
import { DetailFormSection } from "../DetailFormSection";
import { standardFieldSx } from "../FormControls";
import { StatusChip } from "../StatusChip";

const projectTypeOptions = [
  { label: "설계", value: "DESIGN" },
  { label: "감리", value: "SUPERVISION" },
  { label: "운영", value: "OPERATION" },
] as const;

const meta = {
  title: "Common/ERP Forms",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function FormsExample() {
  const [projectType, setProjectType] = useState<"" | "DESIGN" | "SUPERVISION" | "OPERATION">("");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  return (
    <Stack spacing={3}>
      <DetailFormSection
        actions={
          <StatusChip
            options={{
              APPROVED: { color: "success", label: "승인" },
            }}
            value="APPROVED"
          />
        }
        columns={3}
        title="기본 정보"
      >
        <TextField fullWidth label="프로젝트 코드" size="small" sx={standardFieldSx} value="PJ-2026-001" />
        <TextField fullWidth label="프로젝트명" size="small" sx={standardFieldSx} value="하수처리장 증설" />
        <CodeSelectField
          label="사업구분"
          onChange={setProjectType}
          options={projectTypeOptions}
          value={projectType}
        />
      </DetailFormSection>

      <Box sx={{ maxWidth: 520 }}>
        <DateRangeField
          endValue={endDate}
          label="계약 기간"
          onEndChange={setEndDate}
          onStartChange={setStartDate}
          startValue={startDate}
        />
      </Box>

      <AuditFields
        createdAt="2026-01-05 09:30"
        createdBy="admin"
        updatedAt="2026-02-11 14:20"
        updatedBy="manager"
      />
    </Stack>
  );
}

export const Default: Story = {
  render: () => <FormsExample />,
};
