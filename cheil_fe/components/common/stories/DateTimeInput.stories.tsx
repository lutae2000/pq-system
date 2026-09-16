import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DateTimeInput } from "../DateTimeInput";

const meta = {
  title: "Common/DateTimeInput",
  component: DateTimeInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DateTimeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory() {
  const [value, setValue] = useState("2026-07-02 09:30");

  return (
    <Box sx={{ width: 320 }}>
      <DateTimeInput label="공지 시작일시" onChange={setValue} value={value} />
    </Box>
  );
}

export const Default: Story = {
  args: {
    label: "공지 시작일시",
    onChange: () => undefined,
    value: "2026-07-02 09:30",
  },
  render: () => <DefaultStory />,
};
