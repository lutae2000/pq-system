export type SubmissionStatusFilters = {
  year: number;
  throughMonth: number;
};

export type SubmissionCount = {
  departmentCode: string | null;
  year: number;
  count: number;
  total: boolean;
};

export const submissionYears = (year: number) =>
  Array.from({ length: 6 }, (_, index) => year - 5 + index);

export function buildSubmissionStatus(counts: readonly SubmissionCount[], years: number[]) {
  const countsByDepartment = new Map<string | null, number[]>();
  const totals = years.map(() => 0);
  for (const { departmentCode, year, count, total } of counts) {
    const index = years.indexOf(year);
    if (index < 0) continue;
    if (total) {
      totals[index] = count;
      continue;
    }
    const departmentCounts = countsByDepartment.get(departmentCode) ?? years.map(() => 0);
    departmentCounts[index] += count;
    countsByDepartment.set(departmentCode, departmentCounts);
  }

  return {
    departments: Array.from(countsByDepartment, ([departmentCode, yearlyCounts]) => ({ departmentCode, yearlyCounts })),
    totals,
  };
}

export function compareSubmissionCounts(yearlyCounts: number[]) {
  const previous = yearlyCounts.slice(0, -1);
  const average = previous.reduce((sum, count) => sum + count, 0) / previous.length;
  const current = yearlyCounts.at(-1) ?? 0;
  return { average, current, lastYear: previous.at(-1) ?? 0 };
}
