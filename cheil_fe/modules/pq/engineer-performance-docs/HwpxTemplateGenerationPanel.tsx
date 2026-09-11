"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useCommonCodeGroupOptions } from "@/modules/common/reference/useReferenceOptions";
import type { CommonCodeRecord } from "@/modules/code/common-codes/api";
import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import { generateHwpxDocuments, inspectHwpxTemplate, type HwpxTemplateFieldResponse } from "./hwpxApi";
import { PerformanceCertificateGenerationButton } from "./PerformanceCertificateGenerationButton";

type Props = {
  bidNotice: BidNoticeApiRecord | null;
  profiles: EngineerProfile[];
  relatedProjectHistoryConditions: RelatedProjectHistoryCondition[];
  open: boolean;
  showParticipantListButton?: boolean;
};

type Mapping = HwpxTemplateFieldResponse & { path: string };
type CommonCodeGridRow = { codeDetailName: string; id: number; path: string };

const ENGINEER_HWPX_REFERENCE_GROUPS = [
  { key: "basicFields", codeLevel: 3 as const, level1Code: "PQ", level2Code: "HG", useYn: true, sort: "level3Code" as const },
  { key: "careerFields", codeLevel: 3 as const, level1Code: "PQ", level2Code: "HH", useYn: true, sort: "level3Code" as const },
  { key: "historyFields", codeLevel: 3 as const, level1Code: "PQ", level2Code: "HI", useYn: true, sort: "level3Code" as const },
];
const EMPTY_COMMON_CODE_ITEMS: CommonCodeRecord[] = [];

const normalizedFieldName = (value: string | null | undefined) =>
  value?.normalize("NFKC").replace(/[\s_\-./()[\]{}:：]/g, "").toLocaleLowerCase() ?? "";

const referencePath = (refValue1: string | null | undefined) => {
  const path = refValue1?.replace(/\s+/g, "").trim() ?? "";
  return /^(basic|detail|summary|row|history)\.[a-zA-Z][\w]*$/.test(path) ? path : "";
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
const fieldNamesWithoutAdditionalLabel = new Set([
  "이력_근무일(일)",
  "이력_근무일(월)",
  "이력_근무일(년월)",
  "경력_용역일수(일)",
  "경력_용역일수(월)",
  "경력_용역일수(년)",
  "경력_참여일수(일)",
  "경력_참여일수(월)",
  "경력_참여일수(년)",
]);

const commonCodeGridColumns: GridColDef<CommonCodeGridRow>[] = [
  { field: "codeDetailName", flex: 1, headerName: "필드명", minWidth: 180 },
  { field: "path", flex: 0.8, headerName: "매핑 경로", minWidth: 190 },
];

function CommonCodeGridCard({ autoCopyOnCellClick, loading, order, rows, title }: { autoCopyOnCellClick: boolean; loading: boolean; order?: number; rows: CommonCodeGridRow[]; title: string }) {
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    if (!normalizedKeyword) return rows;
    return rows.filter((row) => row.codeDetailName.toLocaleLowerCase().includes(normalizedKeyword));
  }, [keyword, rows]);

  return (
    <Card sx={{ order }} variant="outlined">
      <CardContent>
        <Typography sx={{ mb: 1, fontWeight: 700 }} variant="body2">{title}</Typography>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(keywordDraft);
          }}
          sx={{ display: "flex", gap: 1, mb: 1 }}
        >
          <TextField
            fullWidth
            label="필드명"
            onChange={(event) => setKeywordDraft(event.target.value)}
            placeholder="검색할 필드명 입력"
            size="small"
            value={keywordDraft}
          />
          <Button aria-label="필드명 조회" disabled={loading} startIcon={<SearchOutlinedIcon />} type="submit" variant="contained" />
        </Box>
        <EnterpriseDataGrid<CommonCodeGridRow>
          autoCopyOnCellClick={autoCopyOnCellClick}
          columns={commonCodeGridColumns}
          disableColumnMenu
          disableRowSelectionOnClick
          hideFooter
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
          loading={loading}
          pageSizeOptions={[100]}
          rowHeight={30}
          rows={filteredRows}
          showToolbar={false}
          stateCacheKey={false}
          sx={{ "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 } }}
          getRowId={(row) => row.id}
          wrapperMinHeight={320}
        />
      </CardContent>
    </Card>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function HwpxTemplateGenerationPanel(props: Props) {
  if (!props.open) return null;
  return <HwpxTemplateGenerationPanelContent {...props} />;
}

function HwpxTemplateGenerationPanelContent({ bidNotice, profiles, relatedProjectHistoryConditions, open, showParticipantListButton = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [message, setMessage] = useState<{ severity: "error" | "success"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [autoCopyOnCellClick, setAutoCopyOnCellClick] = useState(false);
  const [showMappings, setShowMappings] = useState(false);
  const fieldGroupsQuery = useCommonCodeGroupOptions(ENGINEER_HWPX_REFERENCE_GROUPS, { enabled: open });
  const basicFieldsQuery = {
    isLoading: fieldGroupsQuery.isLoading,
    items: fieldGroupsQuery.groups.basicFields?.items ?? EMPTY_COMMON_CODE_ITEMS,
  };
  const careerFieldsQuery = {
    isLoading: fieldGroupsQuery.isLoading,
    items: fieldGroupsQuery.groups.careerFields?.items ?? EMPTY_COMMON_CODE_ITEMS,
  };
  const historyFieldsQuery = {
    isLoading: fieldGroupsQuery.isLoading,
    items: fieldGroupsQuery.groups.historyFields?.items ?? EMPTY_COMMON_CODE_ITEMS,
  };
  const basicFieldRows = useMemo<CommonCodeGridRow[]>(
    () => basicFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId, path: referencePath(item.refValue1) })),
    [basicFieldsQuery.items],
  );
  const basicFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    basicFieldsQuery.items.forEach((item) => {
      const label = item.codeDetailName || item.codeName;
      labels[item.level3Code] = label;
      labels[`HG${item.level3Code}`] = label;
      labels[`기본_${item.level3Code}`] = label;
      labels[`기본_HG${item.level3Code}`] = label;
      labels[label] = label;
      labels[`기본_${label}`] = label;
    });
    return labels;
  }, [basicFieldsQuery.items]);
  const careerFieldRows = useMemo<CommonCodeGridRow[]>(
    () => careerFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId, path: referencePath(item.refValue1) })),
    [careerFieldsQuery.items],
  );
  const historyFieldRows = useMemo<CommonCodeGridRow[]>(
    () => historyFieldsQuery.items.map((item) => ({ codeDetailName: item.codeDetailName || item.codeName, id: item.codeId, path: referencePath(item.refValue1) })),
    [historyFieldsQuery.items],
  );
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

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".hwpx")) {
      setMessage({ severity: "error", text: "HWPX 파일만 업로드할 수 있습니다." });
      return;
    }
    try {
      const [fields, referenceResult] = await Promise.all([
        inspectHwpxTemplate(file),
        fieldGroupsQuery.refetch(),
      ]);
      const groups = referenceResult.data ?? {};
      const references = [
        ...(groups.basicFields?.items ?? []),
        ...(groups.careerFields?.items ?? []),
        ...(groups.historyFields?.items ?? []),
      ];
      setTemplate(file);
      setTemplateName(file.name);
      setMappings(fields.map((field) => {
        const reference = findFieldReference(field.name, references);
        return { ...field, path: referencePath(reference?.refValue1) };
      }));
      setShowMappings(false);
      const mappedCount = fields.filter((field) => {
        const reference = findFieldReference(field.name, references);
        return Boolean(referencePath(reference?.refValue1));
      }).length;
      setMessage({ severity: "success", text: `양식 필드 ${fields.length}개를 추출했고, ${mappedCount}개 필드를 매핑했습니다.` });
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
          <Box
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
              pb: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} variant="h6">PQ문서 생성</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {showParticipantListButton ? <PerformanceCertificateGenerationButton
                bidSeq={bidNotice?.bidSeq ?? 0}
                disabled={!bidNotice?.bidSeq || profiles.length === 0}
                engineerIds={profiles.map((profile) => profile.summary.id)}
                engineerNames={Object.fromEntries(profiles.map((profile) => [profile.summary.id, profile.summary.name]))}
                filenamePrefix={bidNotice?.projectName ?? undefined}
                includeParticipantList
                label="참여자명단 + 실적증명서"
                onError={(text) => setMessage({ severity: "error", text })}
                onSuccess={(text) => setMessage({ severity: "success", text })}
                relatedProjectHistoryConditions={relatedProjectHistoryConditions.length > 0 ? JSON.stringify(relatedProjectHistoryConditions) : undefined}
              /> : null}
              <PerformanceCertificateGenerationButton
                bidSeq={bidNotice?.bidSeq ?? 0}
                disabled={!bidNotice?.bidSeq || profiles.length === 0}
                engineerIds={profiles.map((profile) => profile.summary.id)}
                engineerNames={Object.fromEntries(profiles.map((profile) => [profile.summary.id, profile.summary.name]))}
                filenamePrefix={bidNotice?.projectName ?? undefined}
                onError={(text) => setMessage({ severity: "error", text })}
                onSuccess={(text) => setMessage({ severity: "success", text })}
                relatedProjectHistoryConditions={relatedProjectHistoryConditions.length > 0 ? JSON.stringify(relatedProjectHistoryConditions) : undefined}
              />
              <Button
                disabled={basicFieldsQuery.isLoading || careerFieldsQuery.isLoading || historyFieldsQuery.isLoading}
                fullWidth
                onClick={() => inputRef.current?.click()}
                startIcon={<UploadFileOutlinedIcon />}
                sx={{ minWidth: 190, whiteSpace: "nowrap" }}
                variant="outlined"
              >
                한글양식(HWPX) 업로드
              </Button>
              <Button
                disabled={!template || !bidNotice?.bidSeq || profiles.length === 0 || generating}
                fullWidth
                onClick={() => void handleGenerate()}
                startIcon={<DownloadOutlinedIcon />}
                sx={{ minWidth: 190, whiteSpace: "nowrap" }}
                variant="contained"
              >
                {generating ? "생성 중..." : "선택 기술인별 HWPX 생성"}
              </Button>
            </Stack>
            <input accept=".hwpx" hidden onChange={(event) => void handleUpload(event.target.files?.[0])} ref={inputRef} type="file" />
          </Box>
          {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
          {template ? <Chip label={`${templateName} · ${mappings.length}개 필드 · ${profiles.length}명 대상`} size="small" sx={{ alignSelf: "flex-start" }} /> : null}
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">화면 매핑 기준 항목</Typography>
          <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between" }}>
            <Stack spacing={0.75}>
              <Alert
                severity="info"
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  py: 0.5,
                  width: "fit-content",
                }}
              >
                필드명에 <strong>xx</strong>가 포함되면 매핑된 값의 줄바꿈이 제거됩니다.
              </Alert>
              <Alert
                severity="info"
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  py: 0.5,
                  width: "fit-content",
                }}
              >
                HWPX 파일만 업로드할 수 있으며, HWP 파일은 한글 프로그램에서 HWPX로 변환한 후 업로드해 주세요.
              </Alert>
            </Stack>
            <FormControlLabel
              control={<Checkbox checked={autoCopyOnCellClick} onChange={(event) => setAutoCopyOnCellClick(event.target.checked)} />}
              label="셀 클릭 시 자동복사 (Ctrl+C)"
              sx={{ ml: "auto", mr: 0 }}
            />
          </Box>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))", xs: "1fr" } }}>
            <CommonCodeGridCard autoCopyOnCellClick={autoCopyOnCellClick} loading={basicFieldsQuery.isLoading} rows={basicFieldRows} title="기술인 기본항목 (PQ/HG)" />
            <CommonCodeGridCard autoCopyOnCellClick={autoCopyOnCellClick} loading={careerFieldsQuery.isLoading} order={3} rows={careerFieldRows} title="기술인 경력항목 (PQ/HH)" />
            <CommonCodeGridCard autoCopyOnCellClick={autoCopyOnCellClick} loading={historyFieldsQuery.isLoading} order={2} rows={historyFieldRows} title="기술자 이력항목 (PQ/HI)" />
          </Box>
          {mappings.length > 0 ? (
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setShowMappings((current) => !current)} size="small" sx={{ minWidth: 0, px: 1 }} variant="text">
                  {showMappings ? "필드 매핑 숨기기" : "필드 매핑 확인"}
                </Button>
              </Box>
              {showMappings ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  {mappings.map((mapping, index) => {
                    const fieldLabel = basicFieldLabels[mapping.name] ?? careerFieldLabels[mapping.name] ?? historyFieldLabels[mapping.name];
                    const displayFieldName =
                      fieldNamesWithoutAdditionalLabel.has(mapping.name) || !fieldLabel || mapping.name.endsWith(fieldLabel)
                        ? mapping.name
                        : `${mapping.name} · ${fieldLabel}`;
                    return <Box key={mapping.name} sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", display: "grid", gap: 1, gridTemplateColumns: { md: "minmax(220px, 0.8fr) minmax(0, 1.5fr)", xs: "1fr" }, pb: 1 }}>
                      <Box sx={{ overflowWrap: "anywhere" }}>{displayFieldName}</Box>
                      <TextField fullWidth onChange={(event) => setMappings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, path: event.target.value } : item))} placeholder="row.jobName" size="small" value={mapping.path} />
                    </Box>;
                  })}
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
