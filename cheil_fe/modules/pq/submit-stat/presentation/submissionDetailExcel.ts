import type { GridColDef } from "@mui/x-data-grid";
import type { toSubmissionDetailRow } from "../application/mapper";

type SubmissionDetailRow = ReturnType<typeof toSubmissionDetailRow>;

export async function downloadSubmissionDetailWorkbook(
  fileName: string,
  columns: GridColDef<SubmissionDetailRow>[],
  rows: SubmissionDetailRow[],
  registrantNames: Record<string, string>,
) {
  const { Workbook } = await import("exceljs-community/dist/exceljs.min.js");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("PQ 제출 상세", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((column) => ({
    key: column.field,
    header: column.headerName ?? column.field,
    width: Math.max(12, Math.round((column.width ?? column.minWidth ?? 120) / 8)),
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.getColumn("designAmt").numFmt = "#,##0.##";
  sheet.addRows(rows.map((row) => ({
    ...row,
    bidSuccessYn: row.bidSuccessYnLabel,
    department: row.departmentName,
    client: row.orderClientName || row.client,
    writerName: registrantNames[row.writerName] ?? row.writerName,
  })));

  const fileData = await workbook.xlsx.writeBuffer();
  const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/[<>:"/\\|?*]/g, "_")}.xlsx`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
