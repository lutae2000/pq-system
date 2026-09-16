import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { SearchSelectInput } from "../SearchSelectInput";

const companyOptions = ["제일엔지니어링", "서울건축", "한강토목", "대전구조기술"];

const meta = {
  title: "Common/SearchSelectInput",
  component: SearchSelectInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SearchSelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchSelectStory({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <Box sx={{ width: 320 }}>
      <SearchSelectInput label="업체명" onChange={setValue} options={companyOptions} value={value} />
    </Box>
  );
}

export const Empty: Story = {
  args: {
    label: "업체명",
    onChange: () => undefined,
    options: companyOptions,
    value: "",
  },
  render: (args) => <SearchSelectStory initialValue={args.value} />,
};

export const Selected: Story = {
  args: {
    label: "업체명",
    onChange: () => undefined,
    options: companyOptions,
    value: "제일엔지니어링",
  },
  render: (args) => <SearchSelectStory initialValue={args.value} />,
};
