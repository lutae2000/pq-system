import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { CheckboxListInput, SelectInput, TextInput } from "../FormControls";

const statusOptions = [
  { label: "사용", value: "Y" },
  { label: "미사용", value: "N" },
] as const;

const roleOptions = [
  { label: "관리자", value: "admin" },
  { label: "검토자", value: "reviewer" },
  { label: "일반 사용자", value: "user" },
] as const;

const meta = {
  title: "Common/FormControls",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicInputs: Story = {
  render: () => {
    const [form, setForm] = useState({ name: "제일엔지니어링", status: "Y" as "Y" | "N", roles: ["admin"] });

    return (
      <Box sx={{ width: 420 }}>
        <Stack spacing={2}>
          <TextInput
            label="업체명"
            name="name"
            onChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
            value={form.name}
          />
          <SelectInput
            label="상태"
            name="status"
            onChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
            options={[...statusOptions]}
            value={form.status}
          />
          <CheckboxListInput
            label="역할"
            name="roles"
            onChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
            options={[...roleOptions]}
            value={form.roles}
          />
        </Stack>
      </Box>
    );
  },
};
