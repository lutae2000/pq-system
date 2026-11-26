import { Box, Chip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import { dateOnly, formatMoney } from "@/modules/common/formatters";
import type { BidNoticeRecord } from "../bidNotice.types";
import { formatBidSuccessForXlsx, formatDepartmentForXlsx, formatOrderClientForXlsx, formatRegistrantForXlsx } from "../bidNoticeXlsxFormatters";

export type BidNoticeGridRow = Pick<BidNoticeRecord,
  | "bidNo" | "participationStatus" | "finalParticipationStatus" | "bidSuccessYn" | "bidSuccessYnLabel"
  | "department" | "departmentName" | "businessTypeLabel" | "client" | "orderClientName" | "projectName"
  | "noticeDate" | "pqSubmissionDate" | "bidClosingDate" | "bidSubmissionDate" | "bidDate"
  | "designAmt" | "estimateAmount" | "writerName"
>;

type BidNoticeGridColDef<Row extends BidNoticeGridRow> = GridColDef<Row> & {
  excludeFromXlsxExport?: boolean;
};

export function buildBidNoticeGridColumns<Row extends BidNoticeGridRow>(
  userNameByEmployeeNo: Record<string, string>,
): BidNoticeGridColDef<Row>[] {
  return [
    { field: "bidNo", headerName: "관리번호", width: 110, align: "center", headerAlign: "center" },
    {
      field: "participationStatus",
      headerName: "최종 참여",
      width: 80,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row, value }) => {
        const label = String(value ?? "-");
        const isParticipating = row.finalParticipationStatus === "Y" || label === "참여" || label === "Y";
        return (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Chip
              color={isParticipating ? "success" : "default"}
              label={label}
              size="small"
              variant={isParticipating ? "filled" : "outlined"}
            />
          </Box>
        );
      },
    },
    {
      field: "bidSuccessYn",
      headerName: "낙찰여부",
      width: 80,
      align: "center",
      headerAlign: "center",
      excludeFromXlsxExport: true,
      valueFormatter: formatBidSuccessForXlsx,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Chip
            color={row.bidSuccessYn === "Y" ? "primary" : "default"}
            label={row.bidSuccessYn === "Y" ? "낙찰" : "미낙찰"}
            sx={row.bidSuccessYn === "Y" ? { fontWeight: 400 } : undefined}
            size="small"
            variant={row.bidSuccessYn === "Y" ? "filled" : "outlined"}
          />
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "부서",
      width: 120,
      align: "center",
      headerAlign: "center",
      valueFormatter: formatDepartmentForXlsx,
      renderCell: ({ row, value }) => (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          {row.departmentName || String(value ?? "")}
        </Box>
      ),
    },
    { field: "businessTypeLabel", headerName: "구분", width: 100, align: "center", headerAlign: "center" },
    {
      field: "client",
      headerName: "발주처",
      width: 150,
      headerAlign: "center",
      valueFormatter: formatOrderClientForXlsx,
      renderCell: ({ row, value }) => row.orderClientName || String(value ?? ""),
    },
    { field: "projectName", headerName: "용역명", flex: 1, minWidth: 240, headerAlign: "center" },
    { field: "noticeDate", headerName: "공고일", width: 110, headerAlign: "center", align: "center" },
    {
      field: "pqSubmissionDate",
      headerName: "PQ 제출일자",
      width: 110,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => dateOnly(row.pqSubmissionDate),
    },
    { field: "bidClosingDate", headerName: "협정서 제출 마감일", width: 145, headerAlign: "center", align: "center" },
    { field: "bidSubmissionDate", headerName: "개찰일", width: 145, headerAlign: "center", align: "center" },
    { field: "bidDate", headerName: "입찰일", width: 145, headerAlign: "center", align: "center" },
    {
      field: "designAmt",
      headerName: "설계금액",
      width: 140,
      headerAlign: "center",
      renderCell: ({ row }) => formatMoney(Number(row.designAmt ?? row.estimateAmount ?? 0)),
    },
    {
      field: "writerName",
      headerName: "작성자",
      width: 90,
      align: "center",
      headerAlign: "center",
      valueFormatter: formatRegistrantForXlsx(userNameByEmployeeNo),
      renderCell: ({ value }) => userNameByEmployeeNo[String(value ?? "")] ?? String(value ?? ""),
    },
  ];
}
