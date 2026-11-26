"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Chip, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import {
  useSaveRelatedProjectHistoryConditions,
  type RelatedProjectHistoryConditionsSettings,
} from "@/modules/pq/pq-participating-engineers/application/useRelatedProjectHistoryConditions";
import type { PqParticipatingEngineerProjectHistoryCondition, RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/domain/projectHistoryCondition";

const RelatedProjectHistoryConditionDialog = dynamic(
  () => import("@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog").then((module) => module.RelatedProjectHistoryConditionDialog),
  { ssr: false },
);

type RelatedProjectHistoryConditionsPanelProps = {
  buttonLabel?: string;
  disabled?: boolean;
  label?: string;
  onSaved: (conditions: PqParticipatingEngineerProjectHistoryCondition[]) => Promise<void>;
  settings: RelatedProjectHistoryConditionsSettings;
};

export function RelatedProjectHistoryConditionsPanel(props: RelatedProjectHistoryConditionsPanelProps) {
  return <ConditionSettings key={JSON.stringify([props.settings.employeeNo, props.settings.bidSeq])} {...props} />;
}

function ConditionSettings({
  buttonLabel = "조건 설정",
  disabled = false,
  label = "",
  onSaved,
  settings,
}: RelatedProjectHistoryConditionsPanelProps) {
  const [openedConditions, setOpenedConditions] = useState<RelatedProjectHistoryCondition[] | null>(null);
  const [applying, setApplying] = useState(false);
  const applyingRef = useRef(false);
  const { showSnackbar } = useAppSnackbar();
  const { bidSeq, conditions, employeeNo, loaded, loading, loadError, reload } = settings;
  const saveConditionsMutation = useSaveRelatedProjectHistoryConditions(settings);
  const conditionDisabled = disabled || !bidSeq || !employeeNo;

  const showError = (error: unknown, message: string) => {
    showSnackbar({ message: error instanceof Error ? error.message : message, severity: "error" });
  };

  const handleOpen = async () => {
    if (loaded) {
      setOpenedConditions(conditions);
      return;
    }
    const result = await reload();
    if (result.isError) {
      showError(result.error, "관련공사 참여이력 조건을 불러오지 못했습니다.");
      return;
    }
    if (result.data) setOpenedConditions(result.data);
  };

  const handleApply = async (nextConditions: RelatedProjectHistoryCondition[]) => {
    if (conditionDisabled || !loaded || applyingRef.current) return;
    applyingRef.current = true;
    setApplying(true);
    let conditionsSaved = false;
    try {
      const saved = await saveConditionsMutation.mutateAsync(nextConditions);
      conditionsSaved = true;
      if (readAuthSessionSnapshot()?.employeeNo !== employeeNo) return;
      await onSaved(saved);
      setOpenedConditions(null);
    } catch (error) {
      if (conditionsSaved) {
        const detail = error instanceof Error ? ` ${error.message}` : "";
        showSnackbar({ message: `조건을 저장했습니다. 조회 결과 반영에 실패했습니다.${detail}`, severity: "error" });
      } else {
        showError(error, "관련공사 참여이력 조건을 저장하지 못했습니다.");
      }
    } finally {
      applyingRef.current = false;
      setApplying(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          minWidth: 0,
        }}
      >
        <Typography sx={{ fontWeight: 800, whiteSpace: "nowrap" }} variant="body2">
          {label}
        </Typography>
        <Chip
          color={conditions.length > 0 ? "primary" : "default"}
          label={!loaded && loadError ? "조건 조회 실패" : `${conditions.length}개 조건`}
          size="small"
          variant={conditions.length > 0 ? "filled" : "outlined"}
        />
        {conditions.slice(0, 2).map((condition) => (
          <Chip
            key={condition.id}
            label={condition.label || "조건 입력 중"}
            size="small"
            sx={{ maxWidth: 360, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
            variant="outlined"
          />
        ))}
        {conditions.length > 2 ? <Chip label={`외 ${conditions.length - 2}개`} size="small" variant="outlined" /> : null}
        <Button
          disabled={conditionDisabled || (!loaded && loading) || applying}
          onClick={() => void handleOpen()}
          size="small"
          startIcon={<SearchOutlinedIcon />}
          type="button"
          variant="outlined"
        >
          {buttonLabel}
        </Button>
      </Box>

      {openedConditions && (
        <RelatedProjectHistoryConditionDialog
          applyLoading={applying}
          disabled={conditionDisabled || applying}
          onApply={handleApply}
          onClose={() => {
            if (!applyingRef.current) setOpenedConditions(null);
          }}
          open
          value={openedConditions}
        />
      )}
    </>
  );
}
