"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Chip, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useState } from "react";

import { readAuthSessionSnapshot } from "@/lib/auth/authSession";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import {
  useSaveRelatedProjectHistoryConditions,
  type RelatedProjectHistoryConditionsSettings,
} from "@/modules/pq/pq-participating-engineers/application/useRelatedProjectHistoryConditions";
import type { RelatedProjectHistoryCondition } from "@/modules/pq/pq-participating-engineers/domain/projectHistoryCondition";

const RelatedProjectHistoryConditionDialog = dynamic(
  () => import("@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog").then((module) => module.RelatedProjectHistoryConditionDialog),
  { ssr: false },
);

type RelatedProjectHistoryConditionsPanelProps = {
  buttonLabel?: string;
  disabled?: boolean;
  label?: string;
  onSaved?: (conditions: RelatedProjectHistoryCondition[]) => void | Promise<void>;
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

  const handleApply = (nextConditions: RelatedProjectHistoryCondition[]) => {
    if (conditionDisabled || !loaded || saveConditionsMutation.isPending) return;
    saveConditionsMutation.mutate(nextConditions, {
      onSuccess: (saved) => {
        if (readAuthSessionSnapshot()?.employeeNo !== employeeNo) return;
        setOpenedConditions(null);
        void Promise.resolve().then(() => onSaved?.(saved)).catch((error: unknown) => {
          showError(error, "조건은 저장했지만 결과에 반영하지 못했습니다.");
        });
      },
      onError: (error) => showError(error, "관련공사 참여이력 조건을 저장하지 못했습니다."),
    });
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
          disabled={conditionDisabled || (!loaded && loading) || saveConditionsMutation.isPending}
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
          applyLoading={saveConditionsMutation.isPending}
          disabled={conditionDisabled || saveConditionsMutation.isPending}
          onApply={handleApply}
          onClose={() => {
            if (!saveConditionsMutation.isPending) setOpenedConditions(null);
          }}
          open
          value={openedConditions}
        />
      )}
    </>
  );
}
