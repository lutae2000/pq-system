"use client";

import { Close as CloseIcon, DeleteOutlineOutlined as DeleteOutlineOutlinedIcon, Download as DownloadIcon, OpenInNew as OpenInNewIcon, VisibilityOutlined as VisibilityOutlinedIcon } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { dateTimeText, formatMoney } from "@/modules/common/formatters";
import { standardFieldSx } from "@/components/common/FormControls";
import { listG2bBidNoticeCandidates } from "@/modules/pq/g2b-bid-notice-candidates/api";
import type { G2bBidNoticeCandidateRow } from "@/modules/pq/g2b-bid-notice-candidates/domain/models";
import { toG2bBidNoticeCandidateRow } from "@/modules/pq/g2b-bid-notice-candidates/domain/models";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";

type Props = {
  comparisonRecord?: G2bBidNoticeCandidateRow | null;
  open: boolean;
  record: G2bBidNoticeCandidateRow | null;
  onClose: () => void;
  onEnterBidNoticeInput?: () => void;
  onDeleteCandidate?: () => void;
  bidNoticeInputLabel?: string;
};

function SectionCard({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: "background.paper", borderColor: "divider", borderRadius: 1, boxShadow: "0 1px 1px rgba(15, 23, 42, 0.04)", overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", bgcolor: "rgba(15, 23, 42, 0.04)", borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", minHeight: 36, px: 1.25 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }} variant="subtitle1">{title}</Typography>
        {action}
      </Box>
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>{children}</CardContent>
    </Card>
  );
}

function CategoryDivider({ title }: { title: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, mt: 0.5 }}>
      <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" }}>{title}</Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

function DetailItem({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>{label}</Typography>
      <TextField
        fullWidth
        size="small"
        slotProps={{ htmlInput: { readOnly: true } }}
        sx={{
          ...standardFieldSx,
          ...(emphasized ? { "& .MuiInputBase-root": { ...standardFieldSx["& .MuiInputBase-root"], bgcolor: "rgba(25, 118, 210, 0.06)" } } : {}),
        }}
        value={value || "-"}
      />
    </Box>
  );
}

type ScheduleRow = {
  id: number;
  name: string;
  method?: string;
  start?: string;
  end?: string;
};

function ScheduleTable({ record }: { record: G2bBidNoticeCandidateRow }) {
  const allRows: Array<Omit<ScheduleRow, "id">> = [
    { name: "공고게시", start: record.bidNtceDate },
    { name: "입찰참가자격등록", end: record.bidQlfctRgstDt },
    { name: "공동수급협정서제출", method: record.cmmnSpldmdAgrmntRcptdocMethd, end: record.pqSubmitDate },
    { name: "입찰보증서접수" },
    { name: "PQ심사신청기한", method: record.pqApplDocRcptMthdNm, end: record.pqApplDocRcptDt },
    { name: "현장(제안요청, 과업)설명회" },
    { name: "입찰서제출", method: record.bidMethdNm, start: record.bidBeginDt, end: record.bidClseDt || record.bidSubmissionDate },
    { name: "개찰", start: record.opengDt },
  ];
  const rows = allRows
    .filter((row) => row.name !== "공동수급협정서제출" || !record.cmmnSpldmdMethdNm.includes("불허"))
    .filter((row) => row.name !== "PQ심사신청기한" || Boolean(row.start?.trim() || row.end?.trim()))
    .map((row, index) => ({ ...row, id: index + 1 }));
  const gridHeight = 32 + (rows.length * 31);

  const displayDate = (value?: string) => value ? dateTimeText(value) : "-";

  return (
    <EnterpriseDataGrid<ScheduleRow>
      columns={[
        { field: "id", headerName: "No", width: 44, align: "center", headerAlign: "center", sortable: false },
        { field: "name", headerName: "진행명", align: "center", headerAlign: "center", minWidth: 135, flex: 1.15, sortable: false },
        { field: "method", headerName: "진행방법", align: "center", headerAlign: "center", minWidth: 100, flex: 0.8, sortable: false, valueFormatter: (value) => value || "-" },
        { field: "start", headerName: "시작일시", align: "center", headerAlign: "center", minWidth: 145, flex: 1, sortable: false, valueFormatter: (value) => displayDate(value as string | undefined) },
        { field: "end", headerName: "종료일시", align: "center", headerAlign: "center", minWidth: 145, flex: 1, sortable: false, valueFormatter: (value) => displayDate(value as string | undefined) },
      ]}
      disableColumnMenu
      disableRowSelectionOnClick
      getRowId={(row) => row.id}
      hideFooter
      columnHeaderHeight={30}
      rowHeight={30}
      rows={rows}
      showToolbar={false}
      sx={{
        height: gridHeight,
        "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 800 },
      }}
      wrapperMinHeight={gridHeight}
    />
  );
}

const participationLimitRegionNames: Record<string, string> = {
  "00": "전국",
  "11": "서울",
};

function participationLimitRegionText(code: string | null | undefined) {
  const normalizedCode = code?.trim() ?? "";
  return (participationLimitRegionNames[normalizedCode] ?? normalizedCode) || "-";
}

function noticeKindChipColor(noticeKind: string): "success" | "error" | "info" | "default" {
  if (noticeKind.includes("취소")) return "error";
  if (noticeKind.includes("변경")) return "info";
  if (noticeKind.includes("등록")) return "success";
  return "default";
}

function downloadAttachment(fileName: string, downloadUrl: string) {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.rel = "noreferrer";
  link.target = "_blank";
  link.click();
}

const loadBidNoticeHistory = async (record: G2bBidNoticeCandidateRow): Promise<G2bBidNoticeCandidateRow[]> => {
  const referenceNumbers = [...new Set([record.bidNtceNo, record.befBidBbancNo].filter(Boolean))];
  const response = await listG2bBidNoticeCandidates({
    bidNtceNo: "",
    ntceKindNm: [],
    cntrctCnclsMthdNm: [],
    srvceDivNm: [],
    bidNtceNm: "",
    ntceInsttNm: "",
    befBidBbancNo: "",
    importedYn: [],
    relatedBidNtceNos: referenceNumbers,
    orderById: false,
    page: 0,
    size: 100,
  });

  const uniqueRows = new Map<number, G2bBidNoticeCandidateRow>();
  response.content.map(toG2bBidNoticeCandidateRow).forEach((item) => uniqueRows.set(item.id, item));
  return [...uniqueRows.values()];
};

const historyComparisonFields = [
  ["bidNtceNm", "입찰공고명"],
  ["ntceInsttNm", "공고기관"],
  ["dminsttNm", "수요기관"],
  ["cntrctCnclsMthdNm", "계약구분"],
  ["srvceDivNm", "용역구분"],
  ["bidMethdNm", "입찰방식"],
  ["prtcptLmtRgnCd", "참가제한지역"],
  ["cmmnSpldmdMethdNm", "공동수급방식"],
  ["sucsfbidMthdNm", "낙찰방법"],
  ["sucsfbidMthdAppStd", "낙찰방법 적용기준"],
  ["pubPrcrmntMidClsfcNm", "공공조달 중분류"],
  ["pubPrcrmntClsfcNm", "공공조달 분류"],
  ["asignBdgtAmt", "배정예산"],
  ["bidNtceDate", "입찰공고일시"],
  ["bidClseDt", "입찰마감일시"],
  ["opengDt", "개찰일시"],
] as const;

function comparisonDisplayValue(field: string, value: string) {
  if (!value) return "-";
  if (["bidNtceDate", "bidClseDt", "opengDt"].includes(field)) return dateTimeText(value);
  if (field === "asignBdgtAmt") return formatMoney(Number(value.replaceAll(",", "")) || 0);
  return value;
}

function getHistoryChanges(current: G2bBidNoticeCandidateRow, previous: G2bBidNoticeCandidateRow | null) {
  if (!previous) return [];
  return historyComparisonFields.flatMap(([field, label]) => {
    const currentValue = current[field as keyof G2bBidNoticeCandidateRow] as string;
    const previousValue = previous[field as keyof G2bBidNoticeCandidateRow] as string;
    return currentValue.trim() === previousValue.trim() ? [] : [{
      current: comparisonDisplayValue(field, currentValue),
      label,
      previous: comparisonDisplayValue(field, previousValue),
    }];
  });
}

export function G2bBidNoticeCandidateDetailDialog({ comparisonRecord = null, open, record, onClose, onEnterBidNoticeInput, onDeleteCandidate, bidNoticeInputLabel = "공고문 입력" }: Props) {
  const [historyDetailRecord, setHistoryDetailRecord] = useState<G2bBidNoticeCandidateRow | null>(null);
  const [historyComparisonRecord, setHistoryComparisonRecord] = useState<G2bBidNoticeCandidateRow | null>(null);
  const historyQuery = useQuery({
    queryKey: ["g2b-bid-notice-candidate-history", record?.id, record?.bidNtceNo, record?.befBidBbancNo],
    queryFn: () => (record ? loadBidNoticeHistory(record) : Promise.resolve([])),
    enabled: open && Boolean(record),
    staleTime: 60 * 1000,
  });

  if (!record) return null;

  const historyRows = historyQuery.data ?? [];
  const currentOrder = Number.parseInt(record.bidNtceOrd, 10);
  const previousOrder = Number.isNaN(currentOrder) ? null : currentOrder - 1;
  const previousRecord = record.ntceKindNm.includes("변경") || record.ntceKindNm.includes("취소")
    ? historyRows.find((item) => item.bidNtceNo === record.bidNtceNo && Number.parseInt(item.bidNtceOrd, 10) === previousOrder) ?? null
    : null;
  const historyChanges = getHistoryChanges(record, comparisonRecord ?? previousRecord);
  const openHistoryDetail = (historyRecord: G2bBidNoticeCandidateRow) => {
    const currentOrder = Number.parseInt(historyRecord.bidNtceOrd, 10);
    const previousOrder = Number.isNaN(currentOrder) ? null : currentOrder - 1;
    const previousRecord = historyRecord.ntceKindNm.includes("변경") || historyRecord.ntceKindNm.includes("취소")
      ? historyRows.find((item) => item.bidNtceNo === historyRecord.bidNtceNo && Number.parseInt(item.bidNtceOrd, 10) === previousOrder) ?? null
      : null;
    setHistoryDetailRecord(historyRecord);
    setHistoryComparisonRecord(previousRecord);
  };

  const historyColumns: GridColDef<G2bBidNoticeCandidateRow>[] = [
    { field: "bidNtceNo", headerName: "공고번호", minWidth: 150, flex: 1, align: "center", headerAlign: "center" },
    { field: "bidNtceOrd", headerName: "차수", width: 75, align: "center", headerAlign: "center" },
    { field: "ntceKindNm", headerName: "공고구분", minWidth: 100, flex: 0.8, align: "center", headerAlign: "center" },
    { field: "bidNtceDate", headerName: "입찰공고일시", minWidth: 150, flex: 1, align: "center", headerAlign: "center", valueFormatter: (value) => dateTimeText(value as string | null) },
    { field: "befBidBbancNo", headerName: "이전 입찰번호", minWidth: 150, flex: 1, align: "center", headerAlign: "center" },
    {
      field: "historyDetail",
      headerName: "공고문 상세",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Tooltip title="공고문 상세">
            <IconButton aria-label="공고문 상세" onClick={() => openHistoryDetail(row)} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "bidNtceUrl",
      headerName: "나라장터",
      width: 110,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => value ? (
        <Tooltip title="나라장터 바로가기">
          <IconButton aria-label="나라장터 바로가기" component="a" href={value as string} rel="noreferrer" size="small" target="_blank">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : <Typography color="text.disabled" variant="body2">-</Typography>,
    },
  ];

  return (
    <>
      <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            maxHeight: "92vh",
            width: { xs: "calc(100vw - 24px)", lg: "calc(100vw - 96px)" },
            maxWidth: "1800px",
          },
        },
      }}
    >
      <DialogTitle sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", pr: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800 }}>나라장터 공고문 상세</Typography>
            {record.ntceKindNm ? <Chip color={noticeKindChipColor(record.ntceKindNm)} label={record.ntceKindNm} size="small" sx={{ "& .MuiChip-label": { fontWeight: 500 } }} variant="filled" /> : null}
          </Box>
        </Box>
        <IconButton aria-label="닫기" onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "background.default", p: 1.5 }}>
        {historyChanges.length > 0 ? (
          <Card sx={{ mb: 1.25, border: 1, borderColor: "warning.light", bgcolor: "rgba(255, 152, 0, 0.06)" }} variant="outlined">
            <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
              <Typography sx={{ color: "warning.dark", fontSize: 13, fontWeight: 800, mb: 0.75 }}>변경사항</Typography>
              <Stack spacing={0.75}>
                {historyChanges.map((change) => (
                  <Box key={change.label} sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { md: "130px minmax(0, 1fr) minmax(0, 1fr)", xs: "1fr" } }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{change.label}</Typography>
                    <Typography sx={{ bgcolor: "rgba(244, 67, 54, 0.08)", color: "error.dark", fontSize: 12, p: 0.5, wordBreak: "break-word" }}>이전: {change.previous}</Typography>
                    <Typography sx={{ bgcolor: "rgba(33, 150, 243, 0.08)", color: "info.dark", fontSize: 12, p: 0.5, wordBreak: "break-word" }}>현재: {change.current}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
        <Box sx={{ alignItems: "start", display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.5fr) minmax(360px, 0.8fr)" } }}>
          <SectionCard title="기본 정보">
            <Stack spacing={1}>
              {/*<CategoryDivider title="공고정보" />*/}
              <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}><DetailItem emphasized label="입찰공고명" value={record.bidNtceNm} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="공고번호" value={record.bidNtceNo} /></Grid>
                <Grid size={{ md: 1, xs: 12 }}><DetailItem label="공고차수" value={record.bidNtceOrd} /></Grid>
                <Grid size={{ md: 4, xs: 12 }}><DetailItem label="공고기관" value={record.ntceInsttNm} /></Grid>
                <Grid size={{ md: 4, xs: 12 }}><DetailItem label="수요기관" value={record.dminsttNm} /></Grid>
              </Grid>
              <CategoryDivider title="상세정보" />
              <Grid container spacing={1}>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="계약구분" value={record.cntrctCnclsMthdNm} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="용역구분" value={record.srvceDivNm} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="추정금액" value={record.asignBdgtAmt ? formatMoney(Number(record.asignBdgtAmt)) : ""} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="참가제한지역" value={participationLimitRegionText(record.prtcptLmtRgnCd)} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="공동수급방식" value={record.cmmnSpldmdMethdNm} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="업종제한여부" value={record.indstrytyLmtYn} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="공공조달중분류" value={record.pubPrcrmntMidClsfcNm} /></Grid>
                <Grid size={{ md: 3, xs: 12 }}><DetailItem label="공공조달분류" value={record.pubPrcrmntClsfcNm} /></Grid>
                <Grid size={{ md: 6, xs: 12 }}><DetailItem label="낙찰방법" value={record.sucsfbidMthdNm} /></Grid>
                <Grid size={{ md: 4.3, xs: 12 }}><DetailItem label="낙찰방법 적용기준" value={record.sucsfbidMthdAppStd} /></Grid>
                <Grid size={{ md: 1.7, xs: 12 }}><DetailItem label="입찰방식" value={record.bidMethdNm} /></Grid>
              </Grid>
              <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 800 }}>공고 이력</Typography>
                  <Chip label={`${historyQuery.data?.length ?? 0}건`} size="small" />
                </Box>
                <EnterpriseDataGrid<G2bBidNoticeCandidateRow>
                  columns={historyColumns}
                  getRowId={(row) => row.id}
                  loading={historyQuery.isLoading}
                  rows={historyQuery.data ?? []}
                  sx={{ height: 260, "& .MuiDataGrid-row:hover": { cursor: "default" } }}
                />
              </Box>
            </Stack>
          </SectionCard>

          <Stack spacing={1.25}>
            <SectionCard title="일정 정보">
              <Stack spacing={0.75}>
                <ScheduleTable record={record} />
              </Stack>
            </SectionCard>
            <SectionCard title="첨부 자료" action={<Chip label={`${record.attachments.length}개`} size="small" />}>
              {record.attachments.length === 0 ? <Typography color="text.secondary" variant="body2">등록된 첨부파일이 없습니다.</Typography> : (
                <Stack spacing={1}>
                  {record.attachments.map((attachment, index) => (
                    <Box
                      key={`${attachment.fileName}-${index}`}
                      onClick={() => attachment.downloadUrl && downloadAttachment(attachment.fileName, attachment.downloadUrl)}
                      onKeyDown={(event) => {
                        if (attachment.downloadUrl && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          downloadAttachment(attachment.fileName, attachment.downloadUrl);
                        }
                      }}
                      role={attachment.downloadUrl ? "button" : undefined}
                      tabIndex={attachment.downloadUrl ? 0 : undefined}
                      sx={{ alignItems: "center", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, cursor: attachment.downloadUrl ? "pointer" : "default", display: "flex", gap: 1, justifyContent: "space-between", minWidth: 0, p: 1, "&:hover": attachment.downloadUrl ? { bgcolor: "action.hover", borderColor: "primary.main" } : undefined }}
                    >
                      <Tooltip title={attachment.fileName} placement="top-start">
                        <Typography sx={{ cursor: "default", fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {attachment.fileName}
                        </Typography>
                      </Tooltip>
                      {attachment.downloadUrl ? <IconButton aria-label={`${attachment.fileName} 다운로드`} component="a" download={attachment.fileName} href={attachment.downloadUrl} onClick={(event) => event.stopPropagation()} rel="noreferrer" size="small" target="_blank"><DownloadIcon fontSize="small" /></IconButton> : <Typography color="text.disabled" sx={{ flexShrink: 0, fontSize: 11 }}>URL 없음</Typography>}
                    </Box>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, py: 1.25 }}>
        <Button color="error" disabled={!onDeleteCandidate} onClick={onDeleteCandidate} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">삭제</Button>
        <Box sx={{ flex: 1 }} />
        {record.bidNtceUrl ? <Button component="a" href={record.bidNtceUrl} rel="noreferrer" startIcon={<OpenInNewIcon />} target="_blank" variant="outlined">나라장터 바로가기</Button> : null}
        <Button disabled={!onEnterBidNoticeInput} onClick={onEnterBidNoticeInput} variant="contained">{bidNoticeInputLabel}</Button>
      </DialogActions>
      </Dialog>
      {historyDetailRecord ? (
        <G2bBidNoticeCandidateDetailDialog
          open
          record={historyDetailRecord}
          comparisonRecord={historyComparisonRecord}
          onClose={() => {
            setHistoryDetailRecord(null);
            setHistoryComparisonRecord(null);
          }}
        />
      ) : null}
    </>
  );
}
