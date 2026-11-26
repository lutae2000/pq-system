import { compareSubmissionCounts, type SubmissionDetailFilters, type buildSubmissionStatus } from "../domain/submissionStatus";

type SubmissionStatus = ReturnType<typeof buildSubmissionStatus>;
export type SubmissionStatusRow = ReturnType<typeof compareSubmissionCounts> & {
  id: string;
  departmentCode: string | null;
  departmentName: string;
  monthlyCounts: number[];
  cumulativeCounts: number[];
};

export type SubmissionDetailSelection = {
  filters: SubmissionDetailFilters;
  departmentName: string;
  columnLabel: string;
  displayValue: string;
};

export const submissionStatusHeight = "clamp(740px, calc(100vh - 220px), 1160px)";
export const totalRowId = "total";
export const departmentOrder = new Intl.Collator("ko-KR", { numeric: true });
export const wholeNumber = new Intl.NumberFormat("ko-KR");
export const decimal = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const signedNumber = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1, signDisplay: "exceptZero" });
const signedPercentage = new Intl.NumberFormat("ko-KR", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

export function formatChange(current: number, baseline: number) {
  const difference = current - baseline;
  return baseline === 0 ? signedNumber.format(difference)
    : `${signedNumber.format(difference)} (${signedPercentage.format(difference / baseline)})`;
}

export function buildSubmissionStatusRows(
  status: SubmissionStatus,
  departmentLabels: Record<string, string>,
): SubmissionStatusRow[] {
  if (status.departments.length === 0) return [];

  const departments = status.departments.map(({ departmentCode, monthlyCounts, cumulativeCounts }) => ({
    id: departmentCode === null ? "unassigned" : `department:${departmentCode}`,
    departmentCode,
    departmentName: departmentCode === null ? "미지정" : departmentLabels[departmentCode] || departmentCode,
    monthlyCounts,
    cumulativeCounts,
    ...compareSubmissionCounts(cumulativeCounts),
  })).sort((left, right) => {
    if (left.departmentCode === null) return 1;
    if (right.departmentCode === null) return -1;
    return departmentOrder.compare(left.departmentName, right.departmentName)
      || departmentOrder.compare(left.departmentCode, right.departmentCode);
  });

  return [...departments, {
    id: totalRowId,
    departmentCode: null,
    departmentName: "합계",
    ...status.totals,
    ...compareSubmissionCounts(status.totals.cumulativeCounts),
  }];
}
