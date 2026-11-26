import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useCommonCodeLevel2Options, useUserOptions } from "@/modules/common/reference/useReferenceOptions";
import { bidNoticeRegistrantNames } from "@/modules/pq/bid-notice/application/mapper";
import { buildBidNoticeGridColumns } from "@/modules/pq/bid-notice/presentation/bidNoticeGridColumns";
import { toSubmissionDetailRow } from "../application/mapper";
import { loadBidNoticeSubmissionDetailsForExport, useBidNoticeSubmissionDetails } from "../application/useBidNoticeSubmissionStatus";
import { wholeNumber, type SubmissionDetailSelection } from "./submissionStatusRows";

const BidNoticeDetailPopup = dynamic(
  () => import("@/modules/pq/bid-notice/BidNoticeDetailPopup").then((module) => module.BidNoticeDetailPopup),
  { ssr: false },
);

type SubmissionDetailRow = ReturnType<typeof toSubmissionDetailRow>;

type Props = {
  selection: SubmissionDetailSelection;
  departmentLabels: Record<string, string>;
  enabled: boolean;
  onClose: () => void;
};

export function BidNoticeSubmissionDetailDialog({ selection, departmentLabels, enabled, onClose }: Props) {
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const [selectedBidSeq, setSelectedBidSeq] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { showError } = useAppSnackbar();
  const { filters, departmentName } = selection;
  const { data, error, isFetching, isPlaceholderData } = useBidNoticeSubmissionDetails(
    filters, pagination.page, pagination.pageSize, enabled,
  );
  const { labelByValue: businessTypeLabels } = useCommonCodeLevel2Options("CA", undefined, { enabled });
  const { labelByValue: participationLabels } = useCommonCodeLevel2Options("YA", undefined, { enabled });
  const { items: registrants } = useUserOptions({ useYn: "Y" }, { enabled });
  const registrantNames = useMemo(() => bidNoticeRegistrantNames(registrants), [registrants]);
  const rows = useMemo(
    () => (data?.content ?? []).map((notice) => toSubmissionDetailRow(
      notice, departmentLabels, businessTypeLabels, participationLabels,
    )),
    [data, departmentLabels, businessTypeLabels, participationLabels],
  );
  const columns = useMemo<GridColDef<SubmissionDetailRow>[]>(() => {
    const [idColumn, ...noticeColumns] = buildBidNoticeGridColumns<SubmissionDetailRow>(registrantNames);
    return [
      { ...idColumn, headerName: "공고 ID" },
      ...noticeColumns,
      { field: "noticeNumber", headerName: "공고번호", width: 165 },
    ];
  }, [registrantNames]);
  const years = filters.firstYear === filters.lastYear
    ? `${filters.lastYear}년` : `${filters.firstYear}~${filters.lastYear}년`;
  const months = filters.fromMonth === filters.throughMonth
    ? `${filters.throughMonth}월` : `${filters.fromMonth}~${filters.throughMonth}월`;

  const exportDisabled = !enabled || isExporting || !data?.totalElements;
  const handleExport = async () => {
    if (exportDisabled) return;
    setIsExporting(true);
    try {
      const notices = await loadBidNoticeSubmissionDetailsForExport(filters);
      const exportRows = notices.map((notice) => toSubmissionDetailRow(
        notice, departmentLabels, businessTypeLabels, participationLabels,
      ));
      const { downloadSubmissionDetailWorkbook } = await import("./submissionDetailExcel");
      await downloadSubmissionDetailWorkbook(`PQ_제출상세_${departmentName}_${years}_${months}`, columns, exportRows, registrantNames);
    } catch (error) {
      showError(error instanceof Error ? error.message : "엑셀을 다운로드하지 못했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Dialog fullWidth maxWidth="xl" open={enabled} onClose={onClose}>
        <DialogTitle>PQ 제출 상세</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="subtitle2">{departmentName} · {years} {months}</Typography>
              {data && (
                <Chip
                  label={`공고 ${wholeNumber.format(data.totalElements)}건`}
                  size="small"
                  variant="outlined"
                  sx={{ marginInlineStart: "auto" }}
                />
              )}
            </Stack>
            {error && <Alert severity="error">{error.message}</Alert>}
            <EnterpriseDataGrid
              aria-label="PQ 제출 공고 목록"
              readOnly
              rowSelection={false}
              rows={rows}
              columns={columns}
              showToolbar={false}
              disableColumnMenu
              disableColumnSorting
              loading={isFetching}
              paginationMode="server"
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              onRowDoubleClick={({ row }) => {
                if (!isPlaceholderData) setSelectedBidSeq(row.id);
              }}
              rowCount={data?.totalElements ?? -1}
              pageSizeOptions={[25, 50, 100]}
              wrapperMinHeight="clamp(250px, 55vh, 620px)"
              sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
              localeText={{ noRowsLabel: error ? "목록을 불러오지 못했습니다." : "해당하는 제출 공고가 없습니다." }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.25 }}>
          <Button
            disabled={exportDisabled}
            onClick={handleExport}
            startIcon={isExporting ? <CircularProgress color="inherit" size={18} /> : <FileDownloadOutlinedIcon />}
            variant="contained"
          >
            {isExporting ? "다운로드 중…" : "엑셀 다운로드"}
          </Button>
          <Button color="inherit" onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
      {enabled && selectedBidSeq !== null && (
        <BidNoticeDetailPopup bidSeq={selectedBidSeq} onClose={() => setSelectedBidSeq(null)} open readOnly />
      )}
    </>
  );
}
