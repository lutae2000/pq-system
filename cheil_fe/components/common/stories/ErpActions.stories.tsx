import { Box, Button, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { ConfirmActionDialog, ConfirmDeleteDialog } from "../ConfirmActionDialog";
import { CrudActionBar } from "../CrudActionBar";

const meta = {
  title: "Common/ERP Actions",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ActionsExample() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Stack spacing={3}>
      <CrudActionBar
        onClose={() => undefined}
        onDelete={() => setDeleteOpen(true)}
        onExport={() => undefined}
        onNew={() => undefined}
        onSave={() => setConfirmOpen(true)}
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button onClick={() => setConfirmOpen(true)} variant="contained">
          저장 확인 열기
        </Button>
        <Button color="error" onClick={() => setDeleteOpen(true)} variant="outlined">
          삭제 확인 열기
        </Button>
      </Box>

      <ConfirmActionDialog
        message="변경된 내용을 저장하시겠습니까?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        open={confirmOpen}
        targetLabel="프로젝트 기본정보"
        title="저장 확인"
      />
      <ConfirmDeleteDialog
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => setDeleteOpen(false)}
        open={deleteOpen}
        targetLabel="CT-001 / 토목"
      />
    </Stack>
  );
}

export const Default: Story = {
  render: () => <ActionsExample />,
};
