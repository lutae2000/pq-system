import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { CheckboxSelectInput } from "../CheckboxSelectInput";
import { CommonSelectField } from "../CommonSelectField";
import { SearchSelectInput } from "../SearchSelectInput";

const categoryOptions = [
  { label: "건축", value: "architecture" },
  { label: "토목", value: "civil" },
  { label: "전기", value: "electric" },
] as const;

const meta = {
  title: "Common/SearchControls",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchControlsExample() {
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<"" | "architecture" | "civil" | "electric">("");
  const [selected, setSelected] = useState<Array<"architecture" | "civil" | "electric">>(["architecture"]);

  return (
    <Box sx={{ width: 360 }}>
      <Stack spacing={2}>
        <SearchSelectInput
          label="업체명"
          onChange={setCompany}
          options={["제일엔지니어링", "서울건축", "한강토목"]}
          value={company}
        />
        <CommonSelectField
          label="분야"
          labelPlacement="top"
          onChange={setCategory}
          options={categoryOptions}
          placeholder="전체"
          placeholderDisabled={false}
          value={category}
        />
        <CheckboxSelectInput
          label="복수 분야"
          name="categories"
          onChange={(_, value) => setSelected(value)}
          options={[...categoryOptions]}
          value={selected}
        />
      </Stack>
    </Box>
  );
}

export const Filters: Story = {
  render: () => <SearchControlsExample />,
};
