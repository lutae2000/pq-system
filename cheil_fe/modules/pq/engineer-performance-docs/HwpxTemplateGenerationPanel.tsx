"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { generateHwpxDocuments, inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "./hwpxApi";

type Props = {
  bidNotice: BidNoticeApiRecord | null;
  profiles: EngineerProfile[];
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[];
  open: boolean;
};

type Mapping = HwpxTemplateFieldResponse & { path: string };
type CommonCodeGridRow = { codeDetailName: string; id: number };

const defaultMappings: Record<string, string> = {
  nameKor: "summary.name",
  grade: "row.grade",
  jobName: "row.jobName",
  summary: "row.summary",
  contractAmt: "row.contractAmt",
  ownAmt: "row.ownAmt",
  contractTerm: "row.contractTerm",
  workTerm: "row.workTerm",
  contractFromDate: "row.contractFromDate",
  contractToDate: "row.contractToDate",
  startDate: "row.startDate",
  endDate: "row.endDate",
  compName: "row.compName",
  orderClient: "row.orderClient",
  duty: "row.duty",
  proPart: "row.proPart",
};

const careerFieldPathsByCode: Record<string, string> = {
  "01": "row.seq",
  "03": "row.jobName",
  "04": "row.summary",
  "06": "row.ownAmt",
  "07": "row.ownAmt",
  "08": "row.ownAmt",
  "09": "row.ownAmt",
  "10": "row.ownAmt",
  "12": "row.contractFromDate",
  "13": "row.contractFromDate",
  "14": "row.contractFromDate",
  "15": "row.contractFromDate",
  "16": "row.contractFromDate",
  "17": "row.contractToDate",
  "18": "row.contractToDate",
  "19": "row.contractToDate",
  "20": "row.contractToDate",
  "21": "row.contractToDate",
  "22": "row.contractTerm",
  "23": "row.contractTerm",
  "24": "row.contractTerm",
  "25": "row.startDate",
  "26": "row.startDate",
  "27": "row.startDate",
  "28": "row.startDate",
  "29": "row.startDate",
  "30": "row.endDate",
  "31": "row.endDate",
  "32": "row.endDate",
  "33": "row.endDate",
  "34": "row.endDate",
  "35": "row.workTerm",
  "36": "row.workTerm",
  "37": "row.workTerm",
  "38": "row.selectDay",
  "39": "row.selectDay",
  "40": "row.selectDay",
  "41": "row.partDay",
  "42": "row.partDay",
  "43": "row.partDay",
  "44": "row.jobClass",
  "45": "row.orderClient",
  "47": "row.jobTag",
  "48": "row.duty",
  "49": "row.compName",
  "50": "row.grade",
  "52": "row.engLevel",
  "53": "row.contractAmt",
  "54": "row.contractAmt",
  "55": "row.contractAmt",
  "56": "row.contractAmt",
  "57": "row.contractAmt",
  "58": "row.jobPart",
  "59": "row.proPart",
  "63": "row.remark",
};

const careerFieldPathByLabel = (label: string) => {
  if (label.startsWith("당사금액")) return "row.ownAmt";
  if (label.startsWith("총계약금액")) return "row.contractAmt";
  if (label.startsWith("용역시작일")) return "row.contractFromDate";
  if (label.startsWith("용역종료일")) return "row.contractToDate";
  if (label.startsWith("용역기간")) return "row.contractTerm";
  if (label.startsWith("참여시작일")) return "row.startDate";
  if (label.startsWith("참여종료일")) return "row.endDate";
  if (label.startsWith("참여기간")) return "row.workTerm";
  if (label.startsWith("선택기간")) return "row.selectDay";
  if (label.startsWith("분야기간")) return "row.partDay";
  return "";
};

const historyFieldPathsByCode: Record<string, string> = {
  "01": "history.seq",
  "02": "history.compName",
  "03": "history.entryDate",
  "04": "history.entryDate",
  "05": "history.entryDate",
  "06": "history.entryDate",
  "07": "history.retireDate",
  "08": "history.retireDate",
  "09": "history.retireDate",
  "10": "history.retireDate",
  "11": "history.workTerm",
  "12": "history.workTerm",
  "13": "history.workTerm",
  "14": "history.grade",
  "15": "history.duty",
  "16": "history.deptName",
};

const historyFieldPathByLabel = (label: string) => {
  if (label.startsWith("입사일")) return "history.entryDate";
  if (label.startsWith("퇴사일")) return "history.retireDate";
  if (label.startsWith("근무기간")) return "history.workTerm";
  return "";
};

const commonCodeGridColumns: GridColDef<CommonCodeGridRow>[] = [
  { field: "codeDetailName", flex: 1, headerName: "필드명", minWidth: 180 },
];

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function HwpxTemplateGenerationPanel({ bidNotice, profiles, relatedProjectHistoryConditions, open }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const basicFieldsQuery = useCommonCodeLevel3Options("PQ", "HG", { useYn: "Y" }, { enabled: open }, "level3Code");
  const careerFieldsQuery = useCommonCodeLevel3Options("PQ", "HH", { useYn: "Y" }, { enabled: open }, "level3Code");
  const historyFieldsQuery = useCommonCodeLevel3Options("PQ", "HI", { useYn: "Y" }, { enabled: open }, "level3Code");
  const basicFieldRows = useMemo<CommonCodeGridRow[]>(
    () => basicFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId })),
    [basicFieldsQuery.items],
  );
  const careerFieldRows = useMemo<CommonCodeGridRow[]>(
    () => careerFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId })),
    [careerFieldsQuery.items],
  );
  const historyFieldRows = useMemo<CommonCodeGridRow[]>(
    () => historyFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId })),
    [historyFieldsQuery.items],
  );
  const careerFieldAliases = useMemo(() => {
    const aliases: Record<string, string> = {};
    careerFieldsQuery.items.forEach((item) => {
      const label = item.codeDetailName || item.codeName;
      const path = careerFieldPathByLabel(label) || careerFieldPathsByCode[item.level3Code];
      if (!path) return;
      aliases[item.level3Code] = path;
      aliases[`HH${item.level3Code}`] = path;
      aliases[`경력_${item.level3Code}`] = path;
      aliases[`경력_HH${item.level3Code}`] = path;
      aliases[label] = path;
      aliases[`경력_${label}`] = path;
    });
    return aliases;
  }, [careerFieldsQuery.items]);

  const historyFieldAliases = useMemo(() => {
    const aliases: Record<string, string> = {};
    historyFieldsQuery.items.forEach((item) => {
      const label = item.codeDetailName || item.codeName;
      const path = historyFieldPathByLabel(label) || historyFieldPathsByCode[item.level3Code];
      if (!path) return;
      aliases[item.level3Code] = path;
      aliases[`HI${item.level3Code}`] = path;
      aliases[`이력_${item.level3Code}`] = path;
      aliases[`이력_HI${item.level3Code}`] = path;
      aliases[label] = path;
      aliases[`이력_${label}`] = path;
    });
    return aliases;
  }, [historyFieldsQuery.items]);

  const careerFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    careerFieldsQuery.items.forEach((item) => {
      const label = item.codeDetailName || item.codeName;
      labels[item.level3Code] = label;
      labels[`HH${item.level3Code}`] = label;
      labels[`경력_${item.level3Code}`] = label;
      labels[`경력_HH${item.level3Code}`] = label;
      labels[label] = label;
      labels[`경력_${label}`] = label;
    });
    return labels;
  }, [careerFieldsQuery.items]);
  const historyFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    historyFieldsQuery.items.forEach((item) => {
      const label = item.codeDetailName || item.codeName;
      labels[item.level3Code] = label;
      labels[`HI${item.level3Code}`] = label;
      labels[`이력_${item.level3Code}`] = label;
      labels[`이력_HI${item.level3Code}`] = label;
      labels[label] = label;
      labels[`이력_${label}`] = label;
    });
    return labels;
  }, [historyFieldsQuery.items]);

  if (!open) return null;

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".hwpx")) {
      setMessage({ severity: "error", text: "HWPX 파일만 업로드할 수 있습니다." });
      return;
    }
    try {
      const fields = await inspectHwpxTemplate(file);
      setTemplate(file);
      setTemplateName(file.name);
      setMappings(fields.map((field) => ({
        ...field,
        path: defaultMappings[field.name] ?? careerFieldAliases[field.name] ?? historyFieldAliases[field.name] ?? "",
      })));
      setMessage({ severity: "success", text: `양식 필드 ${fields.length}개를 추출했습니다.` });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "HWPX 양식을 읽지 못했습니다." });
    }
  };

  const handleGenerate = async () => {
    if (!template || !bidNotice?.bidSeq || profiles.length === 0) return;
    setGenerating(true);
    try {
      const blob = await generateHwpxDocuments(template, {
        bidSeq: bidNotice.bidSeq,
        engineerIds: profiles.map((profile) => profile.summary.id),
        relatedProjectHistoryConditions: relatedProjectHistoryConditions.length > 0 ? JSON.stringify(relatedProjectHistoryConditions) : undefined,
        mappings: Object.fromEntries(mappings.filter((mapping) => mapping.path.trim()).map((mapping) => [mapping.name, mapping.path.trim()])),
      });
      download(blob, `${bidNotice.projectName || "기술인실적"}_산출물.zip`);
      setMessage({ severity: "success", text: `${profiles.length}명의 기술인별 산출물을 생성했습니다.` });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "HWPX 산출물 생성에 실패했습니다." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">1. HWPX 업로드 → 필드 매핑 → 다운로드</Typography>
              <Typography color="text.secondary" variant="body2">양식 분석과 기술인별 반복 행 생성은 백엔드에서 처리합니다.</Typography>
            </Box>
            <Button disabled={careerFieldsQuery.isLoading || historyFieldsQuery.isLoading} onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">HWPX 업로드</Button>
            <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
          </Box>
          {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
          {template ? <Chip label={`${templateName} · ${mappings.length}개 필드 · ${profiles.length}명 대상`} size="small" sx={{ alignSelf: "flex-start" }} /> : <Alert severity="info">HWPX 양식을 업로드해 셀 name 필드를 분석하세요.</Alert>}
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">화면 매핑 기준 항목</Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))", xs: "1fr" } }}>
            <Card variant="outlined">
              <CardContent>
                <Typography sx={{ mb: 1, fontWeight: 700 }} variant="body2">기술인 기본항목 (PQ/HG)</Typography>
                <EnterpriseDataGrid<CommonCodeGridRow>
                  columns={commonCodeGridColumns}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  hideFooter
                  initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                  pageSizeOptions={[100]}
                  rowHeight={30}
                  rows={basicFieldRows}
                  showToolbar={false}
                  stateCacheKey={false}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 } }}
                  getRowId={(row) => row.id}
                  wrapperMinHeight={320}
                />
              </CardContent>
            </Card>
            <Card sx={{ order: 3 }} variant="outlined">
              <CardContent>
                <Typography sx={{ mb: 1, fontWeight: 700 }} variant="body2">기술인 경력항목 (PQ/HH)</Typography>
                <EnterpriseDataGrid<CommonCodeGridRow>
                  columns={commonCodeGridColumns}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  hideFooter
                  initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                  pageSizeOptions={[100]}
                  rowHeight={30}
                  rows={careerFieldRows}
                  showToolbar={false}
                  stateCacheKey={false}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 } }}
                  getRowId={(row) => row.id}
                  wrapperMinHeight={320}
                />
              </CardContent>
            </Card>
            <Card sx={{ order: 2 }} variant="outlined">
              <CardContent>
                <Typography sx={{ mb: 1, fontWeight: 700 }} variant="body2">기술자 이력항목 (PQ/HI)</Typography>
                <EnterpriseDataGrid<CommonCodeGridRow>
                  columns={commonCodeGridColumns}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  hideFooter
                  initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                  pageSizeOptions={[100]}
                  rowHeight={30}
                  rows={historyFieldRows}
                  showToolbar={false}
                  stateCacheKey={false}
                  sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 } }}
                  getRowId={(row) => row.id}
                  wrapperMinHeight={320}
                />
              </CardContent>
            </Card>
          </Box>
          {mappings.length > 0 ? (
            <Table size="small">
              <TableHead><TableRow><TableCell>양식 셀 필드명</TableCell><TableCell>매핑 경로</TableCell><TableCell>샘플</TableCell></TableRow></TableHead>
              <TableBody>{mappings.map((mapping, index) => {
                const fieldLabel = careerFieldLabels[mapping.name] ?? historyFieldLabels[mapping.name];
                return <TableRow key={mapping.name}><TableCell>{fieldLabel ? `${mapping.name} · ${fieldLabel}` : mapping.name}</TableCell><TableCell><TextField fullWidth onChange={(event) => setMappings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, path: event.target.value } : item))} placeholder="row.jobName" size="small" value={mapping.path} /></TableCell><TableCell>{mapping.sampleValue || "-"}</TableCell></TableRow>;
              })}</TableBody>
            </Table>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}><Button disabled={!template || !bidNotice?.bidSeq || profiles.length === 0 || generating} onClick={() => void handleGenerate()} startIcon={<DownloadOutlinedIcon />} variant="contained">{generating ? "생성 중..." : "선택 기술인별 HWPX 생성"}</Button></Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
