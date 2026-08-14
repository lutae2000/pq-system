import type { GridColDef } from "@mui/x-data-grid";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { EnterpriseDataGrid } from "../EnterpriseDataGrid";
import { EditableGridToolbar } from "../EditableGridToolbar";
import { StatusChip } from "../StatusChip";

type Row = {
  amount: number;
  id: number;
  name: string;
  status: "Y" | "N";
};

const rows: Row[] = [
  { id: 1, name: "토목 설계", status: "Y", amount: 12000000 },
  { id: 2, name: "전기 감리", status: "N", amount: 8400000 },
];

const columns: GridColDef<Row>[] = [
  { field: "name", headerName: "업무명", flex: 1, minWidth: 180 },
  {
    field: "status",
    headerName: "상태",
    width: 110,
    renderCell: (params) => (
      <StatusChip
        options={{
          N: { color: "default", label: "미사용", variant: "outlined" },
          Y: { color: "success", label: "사용" },
        }}
        value={params.value}
      />
    ),
  },
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
  title: "Common/EditableGridToolbar",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <EditableGridToolbar
        onAdd={() => undefined}
        onCancel={() => undefined}
        onCopy={() => undefined}
        onDelete={() => undefined}
        onSave={() => undefined}
        selectedCount={1}
      />
      <EnterpriseDataGrid<Row> columns={columns} hideFooter rows={rows} />
    </>
  ),
};
