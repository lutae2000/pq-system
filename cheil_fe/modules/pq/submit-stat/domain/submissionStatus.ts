export type SubmissionStatusFilters = {
  year: number;
  throughMonth: number;
};

export type SubmissionDetailFilters = {
  firstYear: number;
  lastYear: number;
  fromMonth: number;
  throughMonth: number;
  departmentCode: string | null;
  allDepartments: boolean;
};

export type SubmissionCount = {
  departmentCode: string | null;
  year: number;
  count: number;
  monthlyCount: number;
  total: boolean;
};

type CountsByYear = {
  monthlyCounts: number[];
  cumulativeCounts: number[];
};

export const submissionYears = (year: number) =>
  Array.from({ length: 6 }, (_, index) => year - 5 + index);

export function buildSubmissionStatus(counts: readonly SubmissionCount[], years: number[]) {
  const emptyCounts = (): CountsByYear => ({
    monthlyCounts: years.map(() => 0),
    cumulativeCounts: years.map(() => 0),
  });
  const countsByDepartment = new Map<string | null, CountsByYear>();
  const totals = emptyCounts();
  for (const { departmentCode, year, count, monthlyCount, total } of counts) {
    const index = years.indexOf(year);
    if (index < 0) continue;
    if (total) {
      totals.cumulativeCounts[index] = count;
      totals.monthlyCounts[index] = monthlyCount;
      continue;
    }
    const departmentCounts = countsByDepartment.get(departmentCode) ?? emptyCounts();
    departmentCounts.cumulativeCounts[index] += count;
    departmentCounts.monthlyCounts[index] += monthlyCount;
    countsByDepartment.set(departmentCode, departmentCounts);
  }

  return {
    departments: Array.from(countsByDepartment, ([departmentCode, periodCounts]) => ({ departmentCode, ...periodCounts })),
    totals,
  };
}

export function compareSubmissionCounts(yearlyCounts: number[]) {
  const previous = yearlyCounts.slice(0, -1);
  const average = previous.reduce((sum, count) => sum + count, 0) / previous.length;
  const current = yearlyCounts.at(-1) ?? 0;
  return { average, current, lastYear: previous.at(-1) ?? 0 };
}
