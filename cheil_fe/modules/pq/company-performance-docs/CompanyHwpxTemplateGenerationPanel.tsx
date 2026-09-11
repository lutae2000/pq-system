"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { CommonCodeRecord } from "@/modules/code/common-codes/api";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { CompanyPerformanceDocumentTarget } from "@/modules/pq/company-performance/api";
import { generateCompanyPerformanceHwpxDocuments, inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "@/modules/pq/engineer-performance-docs/hwpxApi";
import { PerformanceCertificateGenerationButton } from "@/modules/pq/engineer-performance-docs/PerformanceCertificateGenerationButton";

type Props = { bidNotice: BidNoticeApiRecord | null; targets: CompanyPerformanceDocumentTarget[]; open: boolean };
type MappingRow = HwpxTemplateFieldResponse & { path: string };
type CommonCodeFieldRow = { id: number; fieldName: string; path: string };

const normalizedFieldName = (value: string | null | undefined) =>
  value?.normalize("NFKC").replace(/[\s_\-./()[\]{}:：]/g, "").toLocaleLowerCase() ?? "";

const referenceCompanyPath = (refValue1: string | null | undefined) => {
  const path = refValue1?.replace(/\s+/g, "").trim() ?? "";
  return /^row\.[a-zA-Z][\w]*$/.test(path) ? path : "";
};

const findFieldReference = (fieldName: string, references: CommonCodeRecord[]) => {
  const normalizedName = normalizedFieldName(fieldName);
  return references
    .map((reference) => {
      const candidates = [reference.codeDetailName, reference.codeName, reference.level3Code]
        .map(normalizedFieldName)
        .filter(Boolean);
      const exact = candidates.some((candidate) => candidate === normalizedName);
      const suffix = [reference.codeDetailName, reference.codeName]
        .map(normalizedFieldName)
        .filter(Boolean)
        .filter((candidate) => normalizedName.endsWith(candidate) || candidate.endsWith(normalizedName))
        .sort((left, right) => right.length - left.length)[0];
      return { reference, score: exact ? 3 : suffix ? 2 : 0, candidateLength: suffix?.length ?? 0 };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || right.candidateLength - left.candidateLength)[0]?.reference;
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
  const hbFields = useCommonCodeLevel3Options("PQ", "HB", { useYn: "Y", bypassCache: true }, { enabled: open }, "level3Code");
  const [template, setTemplate] = useState<File | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [autoCopyOnCellClick, setAutoCopyOnCellClick] = useState(false);
  const [fieldKeywordDraft, setFieldKeywordDraft] = useState("");
  const [fieldKeyword, setFieldKeyword] = useState("");
  const fieldRows = useMemo<CommonCodeFieldRow[]>(
    () => hbFields.items.map((item) => ({
      id: item.codeId,
      fieldName: item.codeDetailName || item.codeName,
      path: referenceCompanyPath(item.refValue1),
    })),
    [hbFields.items],
  );
  const filteredFieldRows = useMemo(() => {
    const keyword = fieldKeyword.trim().toLocaleLowerCase();
    return keyword ? fieldRows.filter((row) => row.fieldName.toLocaleLowerCase().includes(keyword)) : fieldRows;
  }, [fieldKeyword, fieldRows]);
  const columns = useMemo<GridColDef<CommonCodeFieldRow>[]>(() => [
    { field: "fieldName", headerName: "필드명", minWidth: 300, flex: 1 },
    { field: "path", headerName: "매핑 경로", minWidth: 240, flex: 0.8 },
  ], []);

  if (!open) return null;
  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".hwpx")) { setMessage({ severity: "error", text: "HWPX 파일만 업로드할 수 있습니다." }); return; }
    try {
      const [fields, referenceResult] = await Promise.all([inspectHwpxTemplate(file), hbFields.refetch()]);
      const references = referenceResult.data?.items ?? [];
      setTemplate(file);
      setMappings(fields.map((field) => {
        const reference = findFieldReference(field.name, references);
        return { ...field, path: referenceCompanyPath(reference?.refValue1) };
      }));
      const mappedCount = fields.filter((field) => {
        const reference = findFieldReference(field.name, references);
        return Boolean(referenceCompanyPath(reference?.refValue1));
      }).length;
      setMessage({ severity: "success", text: `양식 필드 ${fields.length}개를 추출했고, ${mappedCount}개 필드를 매핑했습니다.` });
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
      <Stack direction="row" spacing={1}>
        <PerformanceCertificateGenerationButton
          bidSeq={bidNotice?.bidSeq ?? 0}
          companyPerformanceSeqs={targets.slice().sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)).map((target) => target.companyPerformanceSeq)}
          disabled={!bidNotice?.bidSeq || targets.length === 0}
          filenamePrefix={bidNotice?.projectName ?? undefined}
          onError={(text) => setMessage({ severity: "error", text })}
          onSuccess={(text) => setMessage({ severity: "success", text })}
        />
        <Button disabled={hbFields.isLoading} onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">한글양식(HWPX) 업로드</Button>
        <Button disabled={!template || !bidNotice?.bidSeq || targets.length === 0 || generating} onClick={() => void handleGenerate()} startIcon={<DownloadOutlinedIcon />} variant="contained">{generating ? "생성 중..." : "문서 다운로드"}</Button>
      </Stack>
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
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
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
