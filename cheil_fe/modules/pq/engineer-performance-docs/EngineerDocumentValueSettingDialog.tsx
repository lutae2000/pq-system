import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listCertifications } from "@/modules/code/certifications/api";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import type { CertificateRecord, EducationRecord, EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

export type EngineerDocumentValueSetting = {
  certificate: CertificateRecord | null;
  education: EducationRecord | null;
};

type EngineerDocumentValueSettingDialogProps = {
  engineer: EngineerProfile | null;
  onClose: () => void;
  onConfirm: (value: EngineerDocumentValueSetting) => void;
  open: boolean;
  projectName: string;
  value?: EngineerDocumentValueSetting | null;
};

const display = (value: string | number | null | undefined) => String(value ?? "").trim() || "-";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}

export function EngineerDocumentValueSettingDialog({ engineer, onClose, onConfirm, open, projectName, value }: EngineerDocumentValueSettingDialogProps) {
  const tabQueryEnabled = useTabQueryEnabled(open);
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const degreeReferences = useCommonCodeLevel2Options("ED", { useYn: "Y" }, { enabled: tabQueryEnabled });
  const certificationsQuery = useQuery({
    queryKey: ["code-certifications", "engineer-document-value-setting"],
    queryFn: listCertifications,
    enabled: tabQueryEnabled,
  });
  const [selectionByEngineerId, setSelectionByEngineerId] = useState<Record<string, { certificateId: string; educationId: string }>>({});
  const engineerSelection = engineer ? selectionByEngineerId[engineer.summary.id] : undefined;
  const selectedEducationId = engineerSelection?.educationId ?? value?.education?.id ?? (engineer?.education.length === 1 ? engineer.education[0].id : "");
  const selectedCertificateId = engineerSelection?.certificateId ?? value?.certificate?.id ?? (engineer?.certificates.length === 1 ? engineer.certificates[0].id : "");
  const certificateLabelByCode = Object.fromEntries((certificationsQuery.data ?? []).map((item) => [item.certCode, item.certName]));
  const jobFieldLabel = engineer ? formatReferenceLabel(jobFieldReferences.labelByValue, engineer.detail.jobField || engineer.summary.workField) : "";
  const specialtyFieldLabel = engineer ? formatReferenceLabel(specialtyFieldReferences.labelByValue, engineer.detail.specialtyField || engineer.summary.specialtyField) : "";

  if (!open || !engineer) {
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>
        {projectName ? (
          <Typography component="span" sx={{ color: "primary.main", fontSize: "inherit", fontWeight: 800, lineHeight: "inherit" }}>
            [{projectName}]
          </Typography>
        ) : null}
        {projectName ? " " : null}
        <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit" }}>
          기술인 문서 작성값 설정
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "background.default" }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Grid container columns={{ xs: 12, sm: 12 }} spacing={1.5}>
              <Grid size={{ xs: 6, sm: 2 }}><InfoItem label="성명" value={display(engineer.summary.name)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><InfoItem label="부서" value={display(engineer.summary.department)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><InfoItem label="생년월일" value={display(engineer.detail.birthDate)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><InfoItem label="직위" value={display(engineer.summary.position)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><InfoItem label="전문분야" value={display(specialtyFieldLabel)} /></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><InfoItem label="직무분야" value={display(jobFieldLabel)} /></Grid>
            </Grid>
          </Paper>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 800, mb: 1 }}>학력 선택</FormLabel>
            {engineer.education.length > 0 ? (
              <RadioGroup value={selectedEducationId} name="engineer-education" onChange={(event) => {
                if (engineer) {
                  setSelectionByEngineerId((current) => ({ ...current, [engineer.summary.id]: { certificateId: selectedCertificateId, educationId: event.target.value } }));
                }
              }}>
                {engineer.education.map((item) => (
                  <FormControlLabel
                    key={item.id}
                    value={item.id}
                    control={<Radio size="small" />}
                    label={`${display(item.schoolName)} / ${display(item.major)} / ${display(degreeReferences.labelByValue[item.degree] ?? item.degree)} / 졸업 ${display(item.endDate)}`}
                    sx={{ mb: 0.25 }}
                  />
                ))}
              </RadioGroup>
            ) : <Typography color="text.secondary" variant="body2">등록된 학력이 없습니다.</Typography>}
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 800, mb: 1 }}>자격 선택</FormLabel>
            {engineer.certificates.length > 0 ? (
              <RadioGroup value={selectedCertificateId} name="engineer-certificate" onChange={(event) => {
                if (engineer) {
                  setSelectionByEngineerId((current) => ({ ...current, [engineer.summary.id]: { certificateId: event.target.value, educationId: selectedEducationId } }));
                }
              }}>
                {engineer.certificates.map((item) => (
                  <FormControlLabel
                    key={item.id}
                    value={item.id}
                    control={<Radio size="small" />}
                    label={`${display(certificateLabelByCode[item.certificateName] ?? item.certificateName)} / 자격번호 ${display(item.licenseNo)} / 취득일 ${display(item.issueDate)}`}
                    sx={{ mb: 0.25 }}
                  />
                ))}
              </RadioGroup>
            ) : <Typography color="text.secondary" variant="body2">등록된 자격이 없습니다.</Typography>}
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          onClick={() => {
            onConfirm({
              certificate: engineer.certificates.find((item) => item.id === selectedCertificateId) ?? null,
              education: engineer.education.find((item) => item.id === selectedEducationId) ?? null,
            });
          }}
        >
          적용
        </Button>
      </DialogActions>
    </Dialog>
  );
}
