"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { useBidNoticeSubmissionStatus } from "./application/useBidNoticeSubmissionStatus";
import { buildSubmissionStatus, submissionYears } from "./domain/submissionStatus";
import { BidNoticeSubmissionStatusGrid } from "./presentation/BidNoticeSubmissionStatusGrid";
import { BidNoticeSubmissionStatusTable } from "./presentation/BidNoticeSubmissionStatusTable";
import { buildSubmissionStatusRows } from "./presentation/submissionStatusRows";

const months = Array.from({ length: 12 }, (_, index) => index + 1);
type SubmissionStatusView = "grid" | "table";

export function BidNoticeSubmissionStatusPage() {
  const { canRead } = useCurrentMenuPermission();
  const enabled = useTabQueryEnabled(canRead);
  const [filters, setFilters] = useState(() => ({
    year: Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Seoul" }).format(new Date())),
    throughMonth: 12,
  }));
  const [yearInput, setYearInput] = useState(String(filters.year));
  const [monthInput, setMonthInput] = useState(filters.throughMonth);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<SubmissionStatusView>("grid");
  const query = useBidNoticeSubmissionStatus(filters, revision, enabled);
  const { labelByValue } = useDepartmentOptions({}, { enabled });
  const years = useMemo(() => submissionYears(filters.year), [filters.year]);
  const rows = useMemo(() => buildSubmissionStatusRows(buildSubmissionStatus(query.data ?? [], years), labelByValue), [query.data, years, labelByValue]);
  const isValidYear = /^(19\d{2}|[2-9]\d{3})$/.test(yearInput.trim());
  const periodLabel = filters.throughMonth === 12 ? "연간" : `1–${filters.throughMonth}월 누계`;

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
              onSubmit={(event) => {
                event.preventDefault();
                if (!isValidYear || !enabled || query.isFetching) return;
                setFilters({ year: Number(yearInput), throughMonth: monthInput });
                setRevision((current) => current + 1);
              }}
            >
              <TextField
                label="기준연도"
                size="small"
                value={yearInput}
                onChange={(event) => setYearInput(event.target.value)}
                error={!isValidYear}
                helperText={isValidYear ? undefined : "1900~9999년을 입력하세요."}
                slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }}
                sx={{ width: { xs: "100%", sm: 145 } }}
              />
              <TextField
                select
                label="마감월"
                size="small"
                value={monthInput}
                onChange={(event) => setMonthInput(Number(event.target.value))}
                sx={{ width: { xs: "100%", sm: 145 } }}
              >
                {months.map((month) => <MenuItem key={month} value={month}>{month === 12 ? "12월 (연간)" : `${month}월`}</MenuItem>)}
              </TextField>
              <Button disabled={!enabled || !isValidYear || query.isFetching} startIcon={<SearchOutlinedIcon />} type="submit" variant="contained">
                조회
              </Button>
            </Stack>
          </Paper>
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <ToggleButtonGroup
              aria-label="제출 현황 보기 방식"
              exclusive
              size="small"
              value={view}
              onChange={(_event, next: SubmissionStatusView | null) => {
                if (next !== null) setView(next);
              }}
            >
              <ToggleButton value="grid">그리드</ToggleButton>
              <ToggleButton value="table">테이블</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {query.isError ? <Alert severity="error">{query.error.message}</Alert> : (
            view === "table" ? (
              <BidNoticeSubmissionStatusTable rows={rows} years={years} loading={query.isFetching} />
            ) : (
              <BidNoticeSubmissionStatusGrid rows={rows} years={years} throughMonth={filters.throughMonth} loading={query.isFetching} />
            )
          )}
        </Stack>
      ) : <Alert severity="warning">조회 권한이 없습니다.</Alert>}
    </Box>
  );
}
