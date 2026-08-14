import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { PageHeader } from "../PageHeader";

const meta = {
  title: "Common/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "사용자 관리",
    description: "사용자 계정과 권한 상태를 관리합니다.",
  },
};

export const WithAction: Story = {
  args: {
    title: "협력사 코드",
    description: "협력사 기본 정보와 코드 사용 여부를 관리합니다.",
    action: (
      <Button startIcon={<AddOutlinedIcon />} variant="contained">
        신규 등록
      </Button>
    ),
  },
};
