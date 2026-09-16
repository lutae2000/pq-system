import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { CommonSelectField } from "../CommonSelectField";

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
  title: "Common/CommonSelectField",
  component: CommonSelectField,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CommonSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

function QueryOptionsStory() {
  const [value, setValue] = useState<"" | Department["code"]>("pq");

  return (
    <Box sx={{ width: 320 }}>
      <CommonSelectField
        label="부서"
        mapOption={(item: Department) => ({ label: item.name, value: item.code })}
        onChange={setValue}
        queryFn={async () => departments}
        queryKey={["storybook", "departments"]}
        value={value}
      />
    </Box>
  );
}

export const QueryOptions: Story = {
  args: {
    label: "부서",
    mapOption: (item: unknown) => ({ label: (item as Department).name, value: (item as Department).code }),
    onChange: () => undefined,
    queryFn: async () => departments,
    queryKey: ["storybook", "departments"],
    value: "pq",
  },
  render: () => <QueryOptionsStory />,
};
