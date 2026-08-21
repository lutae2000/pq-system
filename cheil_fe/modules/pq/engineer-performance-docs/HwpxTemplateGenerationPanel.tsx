"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useRef, useState } from "react";

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

const defaultMappings: Record<string, string> = {
  nameKor: "summary.name",
  grade: "detail.qualificationGrade",
  jobName: "row.jobName",
  contractAmt: "row.contractAmt",
  contractFromDate: "row.contractFromDate",
  contractToDate: "row.contractToDate",
  startDate: "row.startDate",
  endDate: "row.endDate",
  compName: "row.compName",
  orderClient: "row.orderClient",
  duty: "row.duty",
  proPart: "row.proPart",
};

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
      setMappings(fields.map((field) => ({ ...field, path: defaultMappings[field.name] ?? "" })));
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
            <Button onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">HWPX 업로드</Button>
            <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
          </Box>
          {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
          {template ? <Chip label={`${templateName} · ${mappings.length}개 필드 · ${profiles.length}명 대상`} size="small" sx={{ alignSelf: "flex-start" }} /> : <Alert severity="info">HWPX 양식을 업로드해 셀 name 필드를 분석하세요.</Alert>}
          {mappings.length > 0 ? (
            <Table size="small">
              <TableHead><TableRow><TableCell>양식 셀 필드명</TableCell><TableCell>매핑 경로</TableCell><TableCell>샘플</TableCell></TableRow></TableHead>
              <TableBody>{mappings.map((mapping, index) => <TableRow key={mapping.name}><TableCell>{mapping.name}</TableCell><TableCell><TextField fullWidth onChange={(event) => setMappings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, path: event.target.value } : item))} placeholder="row.jobName" size="small" value={mapping.path} /></TableCell><TableCell>{mapping.sampleValue || "-"}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}><Button disabled={!template || !bidNotice?.bidSeq || profiles.length === 0 || generating} onClick={() => void handleGenerate()} startIcon={<DownloadOutlinedIcon />} variant="contained">{generating ? "생성 중..." : "선택 기술인별 HWPX 생성"}</Button></Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
