"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { CompanyPerformanceDocumentTarget } from "@/modules/pq/company-performance/api";
import { generateCompanyPerformanceHwpxDocuments, inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "@/modules/pq/engineer-performance-docs/hwpxApi";

type Props = { bidNotice: BidNoticeApiRecord | null; targets: CompanyPerformanceDocumentTarget[]; open: boolean };
type MappingRow = HwpxTemplateFieldResponse & { path: string };
type CommonCodeFieldRow = { id: number; fieldName: string };

const companyPath = (label: string) => {
  const name = label.replace(/^회사실적[_-]?/, "");
  if (name === "순번") return "row.seq";
  if (name.includes("사업명") || name.includes("용역명")) return "row.jobName";
  if (name.includes("용역코드")) return "row.code";
  if (name.includes("발주처")) return "row.orderClient";
  if (name.includes("용역기간") || name.includes("계약기간")) return "row.contractPeriod";
  if (name.includes("계약시작") || name.includes("용역시작")) return "row.contractFromDate";
  if (name.includes("계약종료") || name.includes("용역종료")) return "row.contractToDate";
  if (name.includes("용역일수") || name.includes("용역월수") || name.includes("용역년월")) return "row.contractPeriod";
  if (name.includes("총계약") || name.includes("총금액")) return "row.contractAmt";
  if (name.includes("당사금액")) return "row.ownAmt";
  if (name.includes("공동도급")) return "row.jobRatio";
  if (name.includes("PQ공동지분내역")) return "row.jobRatio";
  if (name.includes("지분율")) return "row.divisionRate";
  if (name.includes("용역구분")) return "row.jobType";
  if (name.includes("총괄")) return "row.generalManagementYn";
  if (name.includes("개요")) return "row.summary";
  if (name.includes("중지일")) return "row.stopDate";
  if (name.includes("비고")) return "row.remark";
  return "";
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CompanyHwpxTemplateGenerationPanel({ bidNotice, targets, open }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hbFields = useCommonCodeLevel3Options("PQ", "HB", { useYn: "Y" }, { enabled: open }, "level3Code");
  const [template, setTemplate] = useState<File | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [autoCopyOnCellClick, setAutoCopyOnCellClick] = useState(false);
  const [fieldKeywordDraft, setFieldKeywordDraft] = useState("");
  const [fieldKeyword, setFieldKeyword] = useState("");
  const fieldRows = useMemo<CommonCodeFieldRow[]>(
    () => hbFields.items.map((item) => ({ id: item.codeId, fieldName: item.codeDetailName || item.codeName })),
    [hbFields.items],
  );
  const filteredFieldRows = useMemo(() => {
    const keyword = fieldKeyword.trim().toLocaleLowerCase();
    return keyword ? fieldRows.filter((row) => row.fieldName.toLocaleLowerCase().includes(keyword)) : fieldRows;
  }, [fieldKeyword, fieldRows]);
  const columns = useMemo<GridColDef<CommonCodeFieldRow>[]>(() => [
    { field: "fieldName", headerName: "필드명", minWidth: 300, flex: 1 },
  ], []);

  if (!open) return null;
  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".hwpx")) { setMessage({ severity: "error", text: "HWPX 파일만 업로드할 수 있습니다." }); return; }
    try {
      const fields = await inspectHwpxTemplate(file);
      setTemplate(file);
      setMappings(fields.map((field) => ({ ...field, path: companyPath(field.name) })));
      setMessage({ severity: "success", text: `양식 필드 ${fields.length}개를 추출했습니다.` });
    } catch (error) { setMessage({ severity: "error", text: error instanceof Error ? error.message : "HWPX 양식을 읽지 못했습니다." }); }
  };
  const handleGenerate = async () => {
    if (!template || !bidNotice?.bidSeq || targets.length === 0) return;
    setGenerating(true);
    try {
      const blob = await generateCompanyPerformanceHwpxDocuments(template, {
        bidSeq: bidNotice.bidSeq,
        companyPerformanceSeqs: targets.map((target) => target.companyPerformanceSeq),
        mappings: Object.fromEntries(mappings.filter((mapping) => mapping.path.trim()).map((mapping) => [mapping.name, mapping.path.trim()])),
      });
      download(blob, `${bidNotice.projectName || "회사실적"}_산출물.hwpx`);
      setMessage({ severity: "success", text: `${targets.length}건의 회사실적을 하나의 HWPX 문서로 생성했습니다.` });
    } catch (error) { setMessage({ severity: "error", text: error instanceof Error ? error.message : "회사실적 HWPX 생성에 실패했습니다." }); }
    finally { setGenerating(false); }
  };
  return <Card variant="outlined"><CardContent><Stack spacing={1.5}>
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
      <Box><Typography sx={{ fontWeight: 800 }} variant="h6">회사실적 HWPX 문서 생성</Typography></Box>
      <Stack direction="row" spacing={1}><Button disabled={hbFields.isLoading} onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">HWPX 업로드</Button><Button disabled={!template || !bidNotice?.bidSeq || targets.length === 0 || generating} onClick={() => void handleGenerate()} startIcon={<DownloadOutlinedIcon />} variant="contained">{generating ? "생성 중..." : "문서 다운로드"}</Button></Stack>
      <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
    </Box>
    {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
    {template ? <Chip label={`${template.name} · ${mappings.length}개 필드 · ${targets.length}건 대상`} size="small" sx={{ alignSelf: "flex-start" }} /> : null}
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 0.75fr) minmax(0, 1.25fr)" } }}>
      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">한글문서 자동생성 안내사항</Typography>
        <Alert severity="info">HWPX 파일만 업로드할 수 있습니다. HWP 파일은 한글 프로그램에서 HWPX로 변환한 후 업로드해 주세요.</Alert>
        <Alert severity="info">양식의 셀 필드명과 PQ/HB 필드명이 일치해야 데이터가 정상적으로 맵핑됩니다.</Alert>
        <Alert severity="info">HWPX 필드명에 xx가 포함되면 맵핑된 값의 줄바꿈이 제거되어 한 줄로 출력됩니다.</Alert>
        <Alert severity="info">문서 다운로드 후 회사실적 대상을 꼭 확인해 주세요</Alert>
        <FormControlLabel
          control={<Checkbox checked={autoCopyOnCellClick} onChange={(event) => setAutoCopyOnCellClick(event.target.checked)} />}
          label="필드명 셀 클릭 시 자동복사 (Ctrl+C)"
        />
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle1">필드명 (PQ/HB)</Typography>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            setFieldKeyword(fieldKeywordDraft);
          }}
          sx={{ display: "flex", gap: 1, mb: 1 }}
        >
          <TextField
            fullWidth
            label="필드명 조회"
            onChange={(event) => setFieldKeywordDraft(event.target.value)}
            placeholder="필드명 입력"
            size="small"
            value={fieldKeywordDraft}
          />
          <Button aria-label="필드명 조회" startIcon={<SearchOutlinedIcon />} type="submit" variant="contained">
          </Button>
        </Box>
        <EnterpriseDataGrid<CommonCodeFieldRow>
          autoCopyOnCellClick={autoCopyOnCellClick}
          columns={columns}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 50 } } }}
          loading={hbFields.isLoading}
          pageSizeOptions={[50, 100]}
          rows={filteredFieldRows}
          rowHeight={30}
          showCellVerticalBorder
          showColumnVerticalBorder
          showPageNumbers
          showToolbar={false}
          stateCacheKey={false}
          wrapperMinHeight={320}
        />
      </Box>
    </Box>
  </Stack></CardContent></Card>;
}
