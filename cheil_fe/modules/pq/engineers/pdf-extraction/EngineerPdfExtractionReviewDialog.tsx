"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, MenuItem, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { findEngineerIdentityMatches } from "@/modules/pq/engineers/api";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import { EngineerPdfExtractionCompanyPerformanceStep, type RegisteredCompanyPerformance } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionCompanyPerformanceStep";
import { mergePdfExtractionWithProfile, normalizePdfReferenceCodes } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionMerge";
import { EngineerPdfExtractionPersonnelStep } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionPersonnelStep";
import { EngineerPdfExtractionProjectHistoryStep } from "@/modules/pq/engineers/pdf-extraction/EngineerPdfExtractionProjectHistoryStep";
import { extractEngineerPdf, type EngineerPdfExtraction, type EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

export type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

type Props = {
  canCreate: boolean;
  canUpdate: boolean;
  certificationNameByCode: ReadonlyMap<string, string>;
  degreeNameByCode: ReadonlyMap<string, string>;
  file: File | null;
  onClose: () => void;
  onRegisterPersonnel: (result: EngineerPdfExtraction, allowDuplicate: boolean) => Promise<string>;
  onRegisterCompanyPerformances: (rows: EngineerPdfExtractionRow[]) => Promise<RegisteredCompanyPerformance[]>;
  onRegisterProjectHistories: (engineerId: string, rows: EngineerPdfExtractionRow[]) => Promise<void>;
  onUpdatePersonnelBasic: (engineerId: string, result: EngineerPdfExtraction) => Promise<void>;
  onUpsertPersonnelSection: (engineerId: string, sectionKey: string, rows: EngineerPdfExtractionRow[]) => Promise<void>;
  open: boolean;
  selectedEngineer: EngineerProfile | null;
};

function isDuplicateEngineerError(error: unknown) {
  return error instanceof Error && (error.message.includes("이미 존재하는 기술인이 있습니다") || error.message.includes("중복된 기술인이 있습니다"));
}

export function EngineerPdfExtractionReviewDialog({ canCreate, canUpdate, certificationNameByCode, degreeNameByCode, file, onClose, onRegisterCompanyPerformances, onRegisterPersonnel, onRegisterProjectHistories, onUpdatePersonnelBasic, onUpsertPersonnelSection, open, selectedEngineer }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [registeredEngineerId, setRegisteredEngineerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateResult, setDuplicateResult] = useState<EngineerPdfExtraction | null>(null);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [workflowMode, setWorkflowMode] = useState<"new" | "update" | null>(null);
  const [updateTargetId, setUpdateTargetId] = useState("");
  const [registeredCompanyPerformances, setRegisteredCompanyPerformances] = useState<RegisteredCompanyPerformance[]>([]);
  const extractionQuery = useQuery({
    queryKey: ["pq-engineer-pdf-extraction", file?.name, file?.size, file?.lastModified],
    queryFn: () => extractEngineerPdf(file as File),
    enabled: open && Boolean(file),
  });
  const extracted = extractionQuery.data;
  const identityMatchesQuery = useQuery({
    queryKey: ["pq-engineer-identity-matches", extracted?.basic.name, extracted?.basic.birthDate],
    queryFn: () => findEngineerIdentityMatches(extracted?.basic.name ?? "", extracted?.basic.birthDate ?? ""),
    enabled: open && Boolean(extracted?.basic.name && extracted?.basic.birthDate),
  });
  const identityMatches = identityMatchesQuery.data ?? [];
  const hasExtractedIdentity = Boolean(extracted?.basic.name && extracted?.basic.birthDate);
  const selectedIdentityMatch = identityMatches.find((profile) => profile.summary.id === selectedEngineer?.summary.id) ?? null;
  const effectiveMode = workflowMode ?? (!hasExtractedIdentity ? "new" : selectedIdentityMatch ? "update" : identityMatchesQuery.isSuccess && identityMatches.length === 0 ? "new" : null);
  const effectiveTargetId = effectiveMode === "update" ? (updateTargetId || selectedIdentityMatch?.summary.id || identityMatches[0]?.summary.id || "") : "";
  const updateTarget = identityMatches.find((profile) => profile.summary.id === effectiveTargetId) ?? null;
  const result = useMemo(
    () => extracted
      ? effectiveMode === "update" && updateTarget
        ? mergePdfExtractionWithProfile(extracted, updateTarget, certificationNameByCode, degreeNameByCode)
        : normalizePdfReferenceCodes(extracted, certificationNameByCode, degreeNameByCode)
      : extracted,
    [certificationNameByCode, degreeNameByCode, effectiveMode, extracted, updateTarget],
  );

  const registerPersonnel = async (result: EngineerPdfExtraction, allowDuplicate = false) => {
    setSaving(true);
    setErrorMessage("");
    try {
      const engineerId = await onRegisterPersonnel(result, allowDuplicate);
      setRegisteredEngineerId(engineerId);
      setDuplicateResult(null);
      setDuplicateConfirmed(false);
      setActiveStep(1);
    } catch (error) {
      if (!allowDuplicate && isDuplicateEngineerError(error)) setDuplicateResult(result);
      else setErrorMessage(error instanceof Error ? error.message : "기술인 인사정보를 등록하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const registerProjectHistories = async (rows: EngineerPdfExtractionRow[]) => {
    const engineerId = effectiveMode === "update" ? effectiveTargetId : registeredEngineerId;
    if (!engineerId) return;
    setSaving(true);
    setErrorMessage("");
    try {
      await onRegisterProjectHistories(engineerId, rows);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기술경력을 등록하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const registerCompanyPerformances = async (rows: EngineerPdfExtractionRow[]) => {
    setSaving(true);
    setErrorMessage("");
    try {
      const registered = await onRegisterCompanyPerformances(rows);
      setRegisteredCompanyPerformances(registered);
      setActiveStep(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회사 실적을 등록하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const upsertPersonnelSection = async (sectionKey: string, rows: EngineerPdfExtractionRow[]) => {
    if (!effectiveTargetId) return;
    setSaving(true);
    setErrorMessage("");
    try {
      await onUpsertPersonnelSection(effectiveTargetId, sectionKey, rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기술인 경력 정보를 업데이트하지 못했습니다.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updatePersonnelBasic = async (nextResult: EngineerPdfExtraction) => {
    if (!effectiveTargetId) return;
    setSaving(true);
    setErrorMessage("");
    try {
      await onUpdatePersonnelBasic(effectiveTargetId, nextResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기술인 기본정보를 업데이트하지 못했습니다.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const activeEngineerId = effectiveMode === "update" ? effectiveTargetId : registeredEngineerId;
  return <>
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={saving ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            height: { xs: "100%", md: "92vh" },
            m: { xs: 0, md: 2 },
            maxWidth: 1920,
            width: { xs: "100%", md: "calc(100vw - 32px)" },
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}><Box sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}><Box><Typography variant="h6" sx={{ fontWeight: 800 }}>기술인 PDF 추출 결과 확인</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{file?.name ?? "PDF 파일"}</Typography></Box><Chip color={extractionQuery.isError ? "error" : registeredEngineerId ? "success" : "warning"} label={extractionQuery.isError ? "추출 실패" : registeredEngineerId ? "1단계 등록 완료" : "검토 필요"} /></Box></DialogTitle>
      <Tabs value={activeStep} onChange={(_, value: number) => setActiveStep(value)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
        <Tab label="1단계 · 기술인 인사정보" />
        <Tab label="2단계 · 회사 실적" />
        <Tab label="3단계 · 기술경력" />
      </Tabs>
      <DialogContent sx={{ p: 1.5, overflow: "auto" }}>
        {extractionQuery.isPending ? <Alert severity="info" sx={{ mb: 1.25 }}>PDF 내용을 분석하고 있습니다.</Alert> : null}
        {extractionQuery.isError ? <Alert severity="error" sx={{ mb: 1.25 }}>{extractionQuery.error instanceof Error ? extractionQuery.error.message : "PDF 추출에 실패했습니다."}</Alert> : null}
        {identityMatchesQuery.isPending && hasExtractedIdentity ? <Alert severity="info" sx={{ mb: 1.25 }}>동일한 이름과 생년월일의 기술인을 확인하고 있습니다.</Alert> : null}
        {identityMatchesQuery.isError ? <Alert severity="error" sx={{ mb: 1.25 }}>기존 기술인 일치 여부를 확인하지 못했습니다.</Alert> : null}
        {identityMatches.length > 0 && !selectedIdentityMatch && effectiveMode === null ? (
          <Alert severity="warning" sx={{ mb: 1.25 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>동일한 이름과 생년월일의 기술인이 있습니다. 신규 등록 또는 기존 기술인 업데이트를 선택해 주세요.</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button disabled={!canCreate} variant="contained" onClick={() => setWorkflowMode("new")}>신규 기술인으로 등록</Button>
              <Button disabled={!canUpdate} variant="outlined" onClick={() => { setUpdateTargetId(identityMatches[0]?.summary.id ?? ""); setWorkflowMode("update"); }}>기존 기술인 업데이트</Button>
            </Box>
          </Alert>
        ) : null}
        {effectiveMode === "update" && updateTarget ? (
          <Alert severity="success" sx={{ mb: 1.25 }}>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 700 }}>업데이트 모드 · {updateTarget.summary.name} ({updateTarget.summary.id})</Typography>
              {identityMatches.length > 1 ? <TextField select size="small" label="업데이트 대상" value={effectiveTargetId} onChange={(event) => setUpdateTargetId(event.target.value)} sx={{ minWidth: 220 }}>
                {identityMatches.map((profile) => <MenuItem key={profile.summary.id} value={profile.summary.id}>{profile.summary.name} · {profile.summary.id}</MenuItem>)}
              </TextField> : null}
            </Box>
          </Alert>
        ) : null}
        {effectiveMode === "new" && identityMatches.length > 0 ? <Alert severity="warning" sx={{ mb: 1.25 }}>동일 인적사항의 기존 기술인과 별도로 신규 등록합니다.</Alert> : null}
        {errorMessage ? <Alert severity="error" sx={{ mb: 1.25 }}>{errorMessage}</Alert> : null}
        {result?.warnings.map((warning) => <Alert key={warning} severity="warning" sx={{ mb: 1.25 }}>{warning}</Alert>)}
        {result && effectiveMode ? <Box><EngineerPdfExtractionPersonnelStep
          active={activeStep === 0}
          key={`personnel-${effectiveMode}-${effectiveTargetId}`}
          disabled={saving || (effectiveMode === "new" ? !canCreate || Boolean(registeredEngineerId) : !canUpdate)}
          mode={effectiveMode}
          onRegister={(nextResult) => registerPersonnel(nextResult, effectiveMode === "new" && identityMatches.length > 0)}
          onUpdateBasic={updatePersonnelBasic}
          onUpsertSection={upsertPersonnelSection}
          open={open}
          result={result}
          certificationNameByCode={certificationNameByCode}
          degreeNameByCode={degreeNameByCode}
        /></Box> : null}
        {result && effectiveMode ? <Box><EngineerPdfExtractionCompanyPerformanceStep
          active={activeStep === 1}
          disabled={saving || !canCreate || !activeEngineerId || registeredCompanyPerformances.length > 0}
          onRegister={registerCompanyPerformances}
          result={result}
        /></Box> : null}
        {result && effectiveMode ? <Box><EngineerPdfExtractionProjectHistoryStep
          active={activeStep === 2}
          companyPerformances={registeredCompanyPerformances}
          disabled={saving || registeredCompanyPerformances.length === 0 || (effectiveMode === "new" ? !canCreate : !canUpdate)}
          engineerId={activeEngineerId}
          key={`projects-${effectiveMode}-${effectiveTargetId}`}
          mode={effectiveMode}
          onRegister={registerProjectHistories}
          result={result}
        /></Box> : null}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2, py: 1.25 }}><Button disabled={saving} onClick={onClose} startIcon={<CloseOutlinedIcon />}>닫기</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(duplicateResult)} onClose={saving ? undefined : () => setDuplicateResult(null)} maxWidth="sm" fullWidth>
      <DialogTitle>중복 기술인 확인</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>이미 존재하는 기술인이 있습니다.</Alert>
        <FormControlLabel control={<Checkbox checked={duplicateConfirmed} onChange={(event) => setDuplicateConfirmed(event.target.checked)} />} label="기존에 입력된 사람과 다른 기술인임을 확인했고, 신규 기술인으로 저장하겠습니다" />
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={() => { setDuplicateResult(null); setDuplicateConfirmed(false); }}>취소</Button>
        <Button disabled={!duplicateConfirmed || saving} variant="contained" onClick={() => { if (duplicateResult) void registerPersonnel(duplicateResult, true); }}>신규 기술인으로 저장</Button>
      </DialogActions>
    </Dialog>
  </>;
}
