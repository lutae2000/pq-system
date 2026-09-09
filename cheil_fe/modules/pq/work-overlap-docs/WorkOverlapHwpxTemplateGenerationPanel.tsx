"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import { inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "@/modules/pq/engineer-performance-docs/hwpxApi";
import type { WorkOverlapEngineerContractRecord } from "@/modules/work-overlap/engineers/api";

type Props = {
  bidNotice: BidNoticeApiRecord | null;
  engineer: EngineerProfile | null;
  contracts: WorkOverlapEngineerContractRecord[];
  open: boolean;
};

type MappingRow = HwpxTemplateFieldResponse & { path: string };
type ContractFieldRow = { id: string; fieldName: string; path: string };

const workOverlapPath = (label: string) => {
  const name = label.toLocaleLowerCase();
  if (name.includes("engineer") || name.includes("기술인") || name.includes("성명")) return "engineer.name";
  if (name.includes("birth") || name.includes("생년월일")) return "engineer.birthDate";
  if (name.includes("contractno") || name.includes("계약번호")) return "row.contractNo";
  if (name.includes("service") || name.includes("용역명")) return "row.serviceName";
  if (name.includes("client") || name.includes("발주처")) return "row.clientName";
  if (name.includes("amount") || name.includes("계약금액")) return "row.contractAmount";
  if (name.includes("share") || name.includes("지분금액")) return "row.shareAmount";
  if (name.includes("start") || name.includes("착수일")) return "row.constructionStartDate";
  if (name.includes("complete") || name.includes("준공일")) return "row.constructionCompleteDate";
  if (name.includes("participation") || name.includes("참여구분")) return "row.participationType";
  if (name.includes("pq")) return "row.pqTargetYn";
  return "";
};

export function WorkOverlapHwpxTemplateGenerationPanel({ bidNotice, engineer, contracts, open }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success" | "info"; text: string } | null>(null);
  const [autoCopyOnCellClick, setAutoCopyOnCellClick] = useState(false);
  const [fieldKeywordDraft, setFieldKeywordDraft] = useState("");
  const [fieldKeyword, setFieldKeyword] = useState("");

  const fieldRows = useMemo<ContractFieldRow[]>(() => [
    { id: "engineer.name", fieldName: "기술인 성명", path: "engineer.name" },
    { id: "engineer.birthDate", fieldName: "기술인 생년월일", path: "engineer.birthDate" },
    { id: "row.contractNo", fieldName: "계약번호", path: "row.contractNo" },
    { id: "row.serviceName", fieldName: "용역명", path: "row.serviceName" },
    { id: "row.clientName", fieldName: "발주처", path: "row.clientName" },
    { id: "row.contractAmount", fieldName: "계약금액", path: "row.contractAmount" },
    { id: "row.shareAmount", fieldName: "지분금액", path: "row.shareAmount" },
    { id: "row.constructionStartDate", fieldName: "착수일", path: "row.constructionStartDate" },
    { id: "row.constructionCompleteDate", fieldName: "준공일", path: "row.constructionCompleteDate" },
    { id: "row.participationType", fieldName: "참여구분", path: "row.participationType" },
    { id: "row.pqTargetYn", fieldName: "PQ 대상 여부", path: "row.pqTargetYn" },
  ], []);
  const filteredFieldRows = useMemo(() => {
    const keyword = fieldKeyword.trim().toLocaleLowerCase();
    return keyword ? fieldRows.filter((row) => row.fieldName.toLocaleLowerCase().includes(keyword) || row.path.toLocaleLowerCase().includes(keyword)) : fieldRows;
  }, [fieldKeyword, fieldRows]);
  const columns = useMemo<GridColDef<ContractFieldRow>[]>(() => [
    { field: "fieldName", headerName: "필드명", minWidth: 180, flex: 1 },
    { field: "path", headerName: "매핑 경로", minWidth: 210, flex: 1 },
  ], []);

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
      setMappings(fields.map((field) => ({ ...field, path: workOverlapPath(field.name) })));
      setMessage({ severity: "success", text: `서식 필드 ${fields.length}개를 추출했습니다.` });
    } catch (error) {
      setMessage({ severity: "error", text: error instanceof Error ? error.message : "HWPX 서식을 읽지 못했습니다." });
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
              <Button onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">HWPX 업로드</Button>
              <Button disabled startIcon={<DownloadOutlinedIcon />} variant="contained">문서 다운로드</Button>
            </Stack>
            <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
          </Box>
          {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
          {template ? <Chip label={`${template.name} · ${mappings.length}개 필드 · ${contracts.length}건 계약`} size="small" sx={{ alignSelf: "flex-start" }} /> : null}
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 0.75fr) minmax(0, 1.25fr)" } }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800 }} variant="subtitle1">업무중복도 문서 자동생성 안내</Typography>
              <Alert severity="info">HWPX 파일을 업로드하면 서식의 필드명을 읽어 업무중복도 전용 데이터 항목과 연결합니다.</Alert>
              <Alert severity="info">현재 선택된 기술인과 저장된 계약 내역을 기준으로 문서 데이터가 구성됩니다.</Alert>
              <Alert severity="info">문서 다운로드 기능은 업무중복도 전용 생성 API 연결 후 활성화됩니다.</Alert>
              <Typography color="text.secondary" variant="body2">
                대상 기술인: {engineer?.summary.name ?? "선택되지 않음"} · 공고: {bidNotice?.projectName ?? "선택되지 않음"}
              </Typography>
              <FormControlLabel control={<Checkbox checked={autoCopyOnCellClick} onChange={(event) => setAutoCopyOnCellClick(event.target.checked)} />} label="필드명 클릭 시 자동복사 (Ctrl+C)" />
            </Stack>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle1">업무중복도 필드</Typography>
              <Box component="form" onSubmit={(event) => { event.preventDefault(); setFieldKeyword(fieldKeywordDraft); }} sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField fullWidth label="필드명 조회" onChange={(event) => setFieldKeywordDraft(event.target.value)} placeholder="필드명 입력" size="small" value={fieldKeywordDraft} />
                <Button aria-label="필드명 조회" startIcon={<SearchOutlinedIcon />} type="submit" variant="contained">조회</Button>
              </Box>
              <EnterpriseDataGrid<ContractFieldRow>
                autoCopyOnCellClick={autoCopyOnCellClick}
                columns={columns}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
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
