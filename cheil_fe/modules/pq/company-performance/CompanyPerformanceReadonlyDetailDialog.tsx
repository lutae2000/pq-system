"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCommonCodeLevel2Options, useCommonCodeLevel3Options } from "@/modules/common/reference/useReferenceOptions";
import {
  CompanyPerformanceDetailDialog,
  type CompanyPerformanceCodeOption,
} from "@/modules/pq/company-performance/CompanyPerformanceDetailDialog";
import { getCompanyPerformance } from "@/modules/pq/company-performance/api";

type CompanyPerformanceReadonlyDetailDialogProps = {
  onClose: () => void;
  open: boolean;
  seq: number | null;
};

export function CompanyPerformanceReadonlyDetailDialog({ onClose, open, seq }: CompanyPerformanceReadonlyDetailDialogProps) {
  const performanceQuery = useQuery({
    queryKey: ["company-performance-readonly-detail", seq],
    queryFn: () => getCompanyPerformance(seq ?? 0),
    enabled: open && Boolean(seq),
  });

  const businessTypeReferences = useCommonCodeLevel2Options("CA", undefined, { enabled: open });
  const jobFinishReferences = useCommonCodeLevel2Options("VA", undefined, { enabled: open });
  const clientKindReferences = useCommonCodeLevel3Options("PQ", "EA", { useYn: "Y" }, { enabled: open });

  const businessTypeOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => businessTypeReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [businessTypeReferences.options],
  );
  const jobFinishOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => jobFinishReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [jobFinishReferences.options],
  );
  const clientKindOptions = useMemo<CompanyPerformanceCodeOption[]>(
    () => clientKindReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [clientKindReferences.options],
  );

  if (!open || !seq) {
    return null;
  }

  if (performanceQuery.data) {
    return (
      <CompanyPerformanceDetailDialog
        businessTypeOptions={businessTypeOptions}
        clientKindOptions={clientKindOptions}
        deleteDisabled
        jobFinishOptions={jobFinishOptions}
        onClose={onClose}
        onDelete={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
        open={open}
        readOnly
        record={performanceQuery.data}
        saveDisabled
        showDeleteButton={false}
        showSaveButton={false}
      />
    );
  }

  if (!performanceQuery.isError) {
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", gap: 2, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>회사 실적 상세</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 180 }}>
        <Alert severity="error">회사 실적 상세를 불러오지 못했습니다.</Alert>
      </DialogContent>
    </Dialog>
  );
}
