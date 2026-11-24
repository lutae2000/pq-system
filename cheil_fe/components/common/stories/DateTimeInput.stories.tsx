import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DateInput, DateTimeInput } from "../DateTimeInput";

const meta = {
  title: "Common/DateTimeInput",
  component: DateTimeInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DateTimeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledInput({ value: initialValue, ...args }: React.ComponentProps<typeof DateTimeInput>) {
  const [value, setValue] = useState(initialValue);
  const Input = args.mode && args.mode !== "date-time" ? DateInput : DateTimeInput;

  return (
    <Box sx={{ width: 320 }}>
      <Input {...args} onChange={setValue} value={value} />
    </Box>
  );
}

export const Default: Story = {
  args: {
    label: "공지 시작일시",
    onChange: () => undefined,
    value: "2026-07-02 09:30",
  },
  render: (args) => <ControlledInput {...args} />,
};

export const DateOnly: Story = {
  args: {
    label: "공고일자",
    mode: "date",
    value: "2026-07-02",
  },
  render: (args) => <ControlledInput {...args} />,
};

export const Month: Story = {
  args: {
    label: "기준월",
    mode: "month",
    value: "2026-07",
  },
  render: (args) => <ControlledInput {...args} />,
};
