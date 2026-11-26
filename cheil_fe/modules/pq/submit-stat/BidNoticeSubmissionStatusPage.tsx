"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Alert, Box, Button, Paper, Stack } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { DateInput } from "@/components/common/DateTimeInput";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { useBidNoticeSubmissionStatus } from "./application/useBidNoticeSubmissionStatus";
import { buildSubmissionStatus, submissionYears } from "./domain/submissionStatus";
import { BidNoticeSubmissionStatusGrid } from "./presentation/BidNoticeSubmissionStatusGrid";
import { buildSubmissionStatusRows, type SubmissionDetailSelection } from "./presentation/submissionStatusRows";

const BidNoticeSubmissionDetailDialog = dynamic(
  () => import("./presentation/BidNoticeSubmissionDetailDialog").then((module) => module.BidNoticeSubmissionDetailDialog),
  { ssr: false },
);

export function BidNoticeSubmissionStatusPage() {
  const { canRead } = useCurrentMenuPermission();
  const enabled = useTabQueryEnabled(canRead);
  const [filters, setFilters] = useState(() => {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      timeZone: "Asia/Seoul",
    }).formatToParts(new Date());
    const { year, month } = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return { year: Number(year), throughMonth: Number(month) };
  });
  const [baseMonthInput, setBaseMonthInput] = useState(
    () => `${filters.year}-${String(filters.throughMonth).padStart(2, "0")}`,
  );
  const [revision, setRevision] = useState(0);
  const [detailSelection, setDetailSelection] = useState<SubmissionDetailSelection | null>(null);
  const { data, error, isFetching } = useBidNoticeSubmissionStatus(filters, revision, enabled);
  const { labelByValue } = useDepartmentOptions({}, { enabled });
  const years = useMemo(() => submissionYears(filters.year), [filters.year]);
  const rows = useMemo(
    () => buildSubmissionStatusRows(buildSubmissionStatus(data ?? [], years), labelByValue),
    [data, years, labelByValue],
  );
  const searchDisabled = !enabled || !baseMonthInput || isFetching;

  return (
    <Box>
      <PageHeader title="부서별 PQ 제출 현황" />
      {canRead ? (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              component="form"
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}
              onSubmit={(event) => {
                event.preventDefault();
                if (searchDisabled) return;
                const [year, month] = baseMonthInput.split("-");
                setFilters({ year: Number(year), throughMonth: Number(month) });
                setRevision((current) => current + 1);
              }}
            >
              <DateInput
                label="기준연월"
                mode="month"
                min="1900-01-01"
                required
                value={baseMonthInput}
                onChange={setBaseMonthInput}
                sx={{ width: { xs: "100%", sm: 170 } }}
              />
              <Button disabled={searchDisabled} startIcon={<SearchOutlinedIcon />} type="submit" variant="contained">
                조회
              </Button>
            </Stack>
          </Paper>
          {error ? <Alert severity="error">{error.message}</Alert> : (
            <BidNoticeSubmissionStatusGrid
              rows={rows}
              years={years}
              throughMonth={filters.throughMonth}
              loading={isFetching}
              onOpenDetails={setDetailSelection}
            />
          )}
          {detailSelection && (
            <BidNoticeSubmissionDetailDialog
              selection={detailSelection}
              departmentLabels={labelByValue}
              enabled={enabled}
              onClose={() => setDetailSelection(null)}
            />
          )}
        </Stack>
      ) : <Alert severity="warning">조회 권한이 없습니다.</Alert>}
    </Box>
  );
}
