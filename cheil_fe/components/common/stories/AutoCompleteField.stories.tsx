import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { AutoCompleteField } from "../AutoCompleteField";

type Department = {
  code: "pq" | "system" | "finance";
  name: string;
};

const departments: Department[] = [
  { code: "pq", name: "PQ팀" },
  { code: "system", name: "시스템관리팀" },
  { code: "finance", name: "재무팀" },
];

const meta = {
  title: "Common/AutoCompleteField",
  component: AutoCompleteField,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AutoCompleteField>;

export default meta;
type Story = StoryObj<typeof meta>;

function MappedOptionsStory() {
  const [value, setValue] = useState("pq");

  return (
    <Box sx={{ width: 320 }}>
      <AutoCompleteField
        label="부서"
        mapOption={(item: Department) => ({ label: item.name, value: item.code })}
        mode="select"
        onChange={setValue}
        items={departments}
        value={value}
      />
    </Box>
  );
}

export const MappedOptions: Story = {
  args: {
    label: "부서",
    mapOption: (item: unknown) => ({ label: (item as Department).name, value: (item as Department).code }),
    onChange: () => undefined,
    items: departments,
    mode: "select",
    value: "pq",
  },
  render: () => <MappedOptionsStory />,
};
