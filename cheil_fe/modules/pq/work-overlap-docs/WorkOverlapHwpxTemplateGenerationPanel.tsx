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
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "@/modules/pq/engineer-performance-docs/hwpxApi";
import type { WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";
import { generateWorkOverlapHwpxDocuments, generateWorkOverlapHwpxTemplateDocument } from "@/modules/work-overlap/engineers/api";

type Props = {
  bidNotice: BidNoticeApiRecord | null;
  engineer: EngineerProfile | null;
  contracts: WorkOverlapEngineerContractRecord[];
  engineerIds: string[];
  open: boolean;
  referenceDate: string;
  workDutyId: string;
};

type MappingRow = HwpxTemplateFieldResponse & { path: string };
type CommonCodeFieldRow = { id: string; fieldName: string; path: string };

const normalizedFieldName = (value: string | null | undefined) =>
  value?.normalize("NFKC").replace(/[\s_\-./()[\]{}:：]/g, "").toLocaleLowerCase() ?? "";

const referenceWorkOverlapPath = (refValue1: string | null | undefined) => {
  const referencePath = refValue1?.replace(/\s+/g, "").trim() ?? "";
  return /^(engineer|row)\.[a-zA-Z][\w]*$/.test(referencePath) ? referencePath : "";
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
      return {
        reference,
        score: exact ? 3 : suffix ? 2 : 0,
        candidateLength: suffix?.length ?? 0,
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || right.candidateLength - left.candidateLength)[0]?.reference;
};

export function WorkOverlapHwpxTemplateGenerationPanel({ bidNotice, contracts, engineerIds, open, referenceDate, workDutyId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hjFields = useCommonCodeLevel3Options("PQ", "HJ", { useYn: "Y", bypassCache: true }, { enabled: open }, "level3Code");
  const [template, setTemplate] = useState<File | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success" | "info"; text: string } | null>(null);
  const [autoCopyOnCellClick, setAutoCopyOnCellClick] = useState(false);
  const [fieldKeywordDraft, setFieldKeywordDraft] = useState("");
  const [fieldKeyword, setFieldKeyword] = useState("");
  const [generating, setGenerating] = useState(false);

  const fieldRows = useMemo<CommonCodeFieldRow[]>(
    () => hjFields.items.map((item) => ({
      id: String(item.codeId ?? item.level3Code ?? item.codeName),
      fieldName: item.codeDetailName?.trim() || item.codeName,
      path: referenceWorkOverlapPath(item.refValue1),
    })),
    [hjFields.items],
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
    if (!file.name.toLowerCase().endsWith(".hwpx")) {
      setMessage({ severity: "error", text: "HWPX 파일만 업로드할 수 있습니다." });
      return;
    }
    try {
      const [fields, referenceResult] = await Promise.all([
        inspectHwpxTemplate(file),
        hjFields.refetch(),
      ]);
      const referenceItems = referenceResult.data?.items ?? [];
      setTemplate(file);
      setMappings(fields.map((field) => {
        const reference = findFieldReference(field.name, referenceItems);
        return {
          ...field,
          path: referenceWorkOverlapPath(reference?.refValue1),
        };
      }));
      const mappedCount = fields.filter((field) => {
        const reference = findFieldReference(field.name, referenceItems);
        return Boolean(referenceWorkOverlapPath(reference?.refValue1));
      }).length;
      setMessage({ severity: "success", text: `서식 필드 ${fields.length}개를 추출했고, ${mappedCount}개 필드를 매핑했습니다.` });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "HWPX 서식을 읽지 못했습니다." });
    }
  };

  const handleDownload = async (includeParticipantList: boolean) => {
    if (!bidNotice?.bidSeq || !workDutyId || engineerIds.length === 0) return;
    setGenerating(true);
    try {
      const blob = await generateWorkOverlapHwpxDocuments({ bidSeq: bidNotice.bidSeq, workDutyId, includeParticipantList });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const projectName = sanitizeDownloadFilename(bidNotice.projectName);
      const prefix = projectName || "업무중복도";
      anchor.download = `${prefix}_${includeParticipantList ? "업무중복도_계약서_참여자명단.zip" : "업무중복도_계약서.zip"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage({ severity: "success", text: "업무중복도 문서를 생성했습니다." });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "업무중복도 문서 생성에 실패했습니다." });
    } finally {
      setGenerating(false);
    }
  };

  const handleTemplateDownload = async () => {
    if (!template || !bidNotice?.bidSeq || !workDutyId) return;
    setGenerating(true);
    try {
      const blob = await generateWorkOverlapHwpxTemplateDocument(template, {
        bidSeq: bidNotice.bidSeq,
        engineerIds,
        referenceDate,
        workDutyId,
        mappings: Object.fromEntries(mappings.filter((mapping) => mapping.path.trim()).map((mapping) => [mapping.name, mapping.path.trim()])),
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizeDownloadFilename(bidNotice.projectName) || "업무중복도"}_업무중복도.hwpx`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage({ severity: "success", text: "업무중복도 HWPX 문서를 생성했습니다." });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "업무중복도 HWPX 문서 생성에 실패했습니다." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">업무중복도 HWPX 문서 생성</Typography>
              <Typography color="text.secondary" variant="body2">선택한 기술인의 업무중복도 계약 내역을 HWPX 서식에 매핑합니다.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button disabled={generating || !bidNotice || !workDutyId || engineerIds.length === 0} onClick={() => void handleDownload(false)} startIcon={<DownloadOutlinedIcon />} variant="contained">계약서</Button>
              <Button disabled={generating || !bidNotice || !workDutyId || engineerIds.length === 0} onClick={() => void handleDownload(true)} startIcon={<DownloadOutlinedIcon />} variant="contained">계약서 + 참여자 명단</Button>
              <Button onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">한글양식(HWPX) 업로드</Button>
              <Button disabled={generating || !template || !bidNotice || !workDutyId} onClick={() => void handleTemplateDownload()} startIcon={<DownloadOutlinedIcon />} variant="contained">{generating ? "생성 중..." : "문서 다운로드"}</Button>
            </Stack>
            <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
          </Box>
          {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
          {template ? <Chip label={`${template.name} · ${mappings.length}개 필드 · ${contracts.length}건 계약`} size="small" sx={{ alignSelf: "flex-start" }} /> : null}
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 1fr) minmax(0, 1fr)" } }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800 }} variant="subtitle1">업무중복도 문서 자동생성 안내</Typography>
              <Alert severity="info">HWPX 파일만 업로드할 수 있습니다. HWP 파일은 한글 프로그램에서 HWPX로 변환한 후 업로드해 주세요.</Alert>
              <Alert severity="info">양식의 셀 필드명과 PQ/HJ 필드명이 일치해야 데이터가 정상적으로 맵핑됩니다.</Alert>
              <Alert severity="info">HWPX 필드명에 xx가 포함되면 맵핑된 값의 줄바꿈이 제거되어 한 줄로 출력됩니다.</Alert>
              <Alert severity="info">문서 다운로드 후 대상을 꼭 확인해 주세요</Alert>
              <FormControlLabel control={<Checkbox checked={autoCopyOnCellClick} onChange={(event) => setAutoCopyOnCellClick(event.target.checked)} />} label="필드명 클릭 시 자동복사 (Ctrl+C)" />
            </Stack>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle1">필드명 (PQ/HJ)</Typography>
              <Box component="form" onSubmit={(event) => { event.preventDefault(); setFieldKeyword(fieldKeywordDraft); }} sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField fullWidth label="필드명 조회" onChange={(event) => setFieldKeywordDraft(event.target.value)} placeholder="필드명 입력" size="small" value={fieldKeywordDraft} />
                <Button aria-label="필드명 조회" startIcon={<SearchOutlinedIcon />} type="submit" variant="contained"></Button>
              </Box>
              <EnterpriseDataGrid<CommonCodeFieldRow>
                autoCopyOnCellClick={autoCopyOnCellClick}
                columns={columns}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                loading={hjFields.isLoading}
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
        </Stack>
      </CardContent>
    </Card>
  );
}

function sanitizeDownloadFilename(value: string | null | undefined) {
  return (value ?? "").replace(/[\\/:*?"<>|]/g, "_").trim();
}
