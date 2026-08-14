"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Chip, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import {
  RelatedProjectHistoryConditionDialog,
  type RelatedProjectHistoryCondition,
} from "@/modules/pq/pq-participating-engineers/RelatedProjectHistoryConditionDialog";
import {
  getRelatedProjectHistoryConditions,
  saveRelatedProjectHistoryConditions,
  type PqParticipatingEngineerProjectHistoryCondition,
} from "@/modules/pq/pq-participating-engineers/api";

type RelatedProjectHistoryConditionsPanelProps = {
  bidSeq?: number | null;
  buttonLabel?: string;
  disabled?: boolean;
  label?: string;
  onApply: (conditions: RelatedProjectHistoryCondition[]) => void;
  value: RelatedProjectHistoryCondition[];
};

const createConditionId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `condition-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const withConditionIds = (conditions: PqParticipatingEngineerProjectHistoryCondition[]): RelatedProjectHistoryCondition[] =>
  conditions.map((condition) => {
    const existingId = (condition as { id?: unknown }).id;
    return {
      ...condition,
      id: typeof existingId === "string" ? existingId : createConditionId(),
    };
  });

export function RelatedProjectHistoryConditionsPanel({
  bidSeq,
  buttonLabel = "조건 설정",
  disabled = false,
  label = "관련공사 참여 이력",
  onApply,
  value,
}: RelatedProjectHistoryConditionsPanelProps) {
  const [open, setOpen] = useState(false);
  const tabQueryEnabled = useTabQueryEnabled(Boolean(bidSeq));
  const queryClient = useQueryClient();
  const lastLoadedSignatureRef = useRef("");

  const savedConditionsQuery = useQuery({
    queryKey: ["related-project-history-conditions", bidSeq ?? "none"],
    queryFn: () => getRelatedProjectHistoryConditions(bidSeq ?? 0),
    enabled: tabQueryEnabled,
  });

  useEffect(() => {
    if (!bidSeq || !savedConditionsQuery.data) {
      return;
    }

    const signature = `${bidSeq}:${JSON.stringify(savedConditionsQuery.data)}`;
    if (lastLoadedSignatureRef.current === signature) {
      return;
    }

    lastLoadedSignatureRef.current = signature;
    onApply(withConditionIds(savedConditionsQuery.data));
  }, [bidSeq, onApply, savedConditionsQuery.data]);

  const saveConditionsMutation = useMutation({
    mutationFn: (conditions: RelatedProjectHistoryCondition[]) => {
      if (!bidSeq) {
        return Promise.resolve(conditions);
      }
      return saveRelatedProjectHistoryConditions({ bidSeq, conditions }).then(withConditionIds);
    },
    onSuccess: async (conditions) => {
      onApply(conditions);
      setOpen(false);
      if (bidSeq) {
        await queryClient.invalidateQueries({ queryKey: ["related-project-history-conditions", bidSeq] });
      }
    },
  });

  const relatedConditionLabels = useMemo(() => value.map((condition) => condition.label || "조건 입력 중"), [value]);

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
          color={value.length > 0 ? "primary" : "default"}
          label={`${value.length}개 조건`}
          size="small"
          variant={value.length > 0 ? "filled" : "outlined"}
        />
        {relatedConditionLabels.slice(0, 2).map((conditionLabel, index) => (
          <Chip
            key={`${conditionLabel}-${index}`}
            label={conditionLabel}
            size="small"
            sx={{ maxWidth: 360, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
            variant="outlined"
          />
        ))}
        {relatedConditionLabels.length > 2 ? <Chip label={`외 ${relatedConditionLabels.length - 2}개`} size="small" variant="outlined" /> : null}
        <Button
          disabled={disabled}
          onClick={() => setOpen(true)}
          size="small"
          startIcon={<SearchOutlinedIcon />}
          type="button"
          variant="outlined"
        >
          {buttonLabel}
        </Button>
      </Box>

      <RelatedProjectHistoryConditionDialog
        applyLoading={saveConditionsMutation.isPending}
        disabled={disabled}
        onApply={(conditions) => {
          void saveConditionsMutation.mutateAsync(conditions);
        }}
        onClose={() => setOpen(false)}
        open={open}
        value={value}
      />
    </>
  );
}
