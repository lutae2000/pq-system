import { Box, Button, Stack, TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { AppModal } from "../AppModal";

const meta = {
  title: "Common/AppModal",
  component: AppModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AppModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  args: {
    children: null,
    onClose: () => undefined,
    open: true,
    title: "상세 정보",
  },
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Box>
        <Button onClick={() => setOpen(true)} variant="contained">
          모달 열기
        </Button>
        <AppModal maxWidth="sm" onClose={() => setOpen(false)} open={open} title="상세 정보">
          <Stack spacing={2}>
            <TextField label="이름" size="small" value="홍길동" />
            <TextField label="부서" size="small" value="PQ팀" />
          </Stack>
        </AppModal>
      </Box>
    );
  },
};
