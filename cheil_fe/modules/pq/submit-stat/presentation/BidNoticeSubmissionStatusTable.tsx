import {
  Alert, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow,
} from "@mui/material";

import { decimal, formatChange, submissionStatusHeight, wholeNumber, type SubmissionStatusRow } from "./submissionStatusRows";

type BidNoticeSubmissionStatusTableProps = {
  rows: SubmissionStatusRow[];
  years: number[];
  loading: boolean;
};

function SubmissionCells({ row }: { row: SubmissionStatusRow }) {
  return (
    <>
      <TableCell component="th" scope="row">{row.departmentName}</TableCell>
      {row.yearlyCounts.slice(0, -1).map((count, index) => (
        <TableCell align="right" key={index}>{wholeNumber.format(count)}</TableCell>
      ))}
      <TableCell align="right">{decimal.format(row.average)}</TableCell>
      <TableCell align="right" className="submission-current-year">{wholeNumber.format(row.current)}</TableCell>
      <TableCell align="right">{formatChange(row.current, row.lastYear)}</TableCell>
      <TableCell align="right">{formatChange(row.current, row.average)}</TableCell>
    </>
  );
}

export function BidNoticeSubmissionStatusTable({ rows, years, loading }: BidNoticeSubmissionStatusTableProps) {
  const total = rows.at(-1);
  if (!total) {
    return loading ? <LinearProgress aria-label="제출 현황 조회 중" /> : <Alert severity="info">조회된 제출 실적이 없습니다.</Alert>;
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: submissionStatusHeight }}>
      {loading && <LinearProgress aria-label="제출 현황 조회 중" />}
      <Table
        size="small"
        stickyHeader
        aria-label="부서별 PQ 제출 건수"
        sx={{
          minWidth: 1040,
          "& .MuiTableCell-root": { whiteSpace: "nowrap" },
          "& .MuiTableCell-alignRight": { fontVariantNumeric: "tabular-nums" },
          "& .MuiTableCell-root:first-child": { position: "sticky", left: 0, minWidth: 150 },
          "& tbody th": { bgcolor: "background.paper", zIndex: 1 },
          "& thead th": { bgcolor: "background.default", fontWeight: 800 },
          "& thead th:first-child": { zIndex: 3 },
          "& tfoot": { position: "sticky", bottom: 0, zIndex: 2 },
          "& tfoot .MuiTableCell-root": {
            bgcolor: "background.default", color: "text.primary", fontSize: "0.875rem", fontWeight: 800,
            borderTop: 1, borderColor: "divider",
          },
          "& .MuiTableCell-root.submission-current-year": {
            bgcolor: "background.paper",
            backgroundImage: (theme) => `linear-gradient(${theme.palette.action.selected}, ${theme.palette.action.selected})`,
            fontWeight: 800,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell scope="col">부서</TableCell>
            {years.slice(0, -1).map((year) => <TableCell align="right" key={year} scope="col">{year}년</TableCell>)}
            <TableCell align="right" scope="col">5년 평균</TableCell>
            <TableCell align="right" className="submission-current-year" scope="col">{years.at(-1)}년</TableCell>
            <TableCell align="right" scope="col">전년 대비</TableCell>
            <TableCell align="right" scope="col">평균 대비</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(0, -1).map((row) => <TableRow hover key={row.id}><SubmissionCells row={row} /></TableRow>)}
        </TableBody>
        <TableFooter>
          <TableRow><SubmissionCells row={total} /></TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
