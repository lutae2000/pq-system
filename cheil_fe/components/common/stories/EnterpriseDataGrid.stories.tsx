import type { GridColDef } from "@mui/x-data-grid";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { EnterpriseDataGrid } from "../EnterpriseDataGrid";

type Row = {
  amount: number;
  id: number;
  manager: string;
  projectName: string;
  status: string;
};

const rows: Row[] = [
  { id: 1, projectName: "서울 업무시설 신축", manager: "김민준", status: "진행", amount: 120000000 },
  { id: 2, projectName: "부산 복합센터", manager: "이서연", status: "검토", amount: 85000000 },
  { id: 3, projectName: "대전 연구동 증축", manager: "박지훈", status: "완료", amount: 64000000 },
];

const columns: GridColDef<Row>[] = [
  { field: "projectName", headerName: "프로젝트", flex: 1, minWidth: 180 },
  { field: "manager", headerName: "담당자", width: 120 },
  { field: "status", headerName: "상태", width: 100 },
  {
    field: "amount",
    headerName: "금액",
    width: 140,
    align: "right",
    headerAlign: "right",
    valueFormatter: (value: number) => value.toLocaleString("ko-KR"),
  },
];

const meta = {
  title: "Common/EnterpriseDataGrid",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <EnterpriseDataGrid<Row> columns={columns} exportFileNamePrefix="프로젝트_목록" rows={rows} />,
};
