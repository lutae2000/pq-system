import { parseDateInput } from "@/modules/common/formatters";

type DateValue = string | null | undefined;

export type ParticipationDates = { startDate: DateValue; endDate: DateValue };
export type ContractPeriodDates = {
  contractFromDate: string | null;
  contractToDate: string | null;
};

export function groupParticipationRows<Row>(rows: readonly Row[], groupKey: (row: Row) => string) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = groupKey(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function calendarDay(value: string | null | undefined) {
  const date = parseDateInput(value ?? "", "date");
  return date ? Date.parse(`${date}T00:00:00Z`) / 86_400_000 : NaN;
}

export function calculateParticipationRatio(
  periods: readonly ParticipationDates[],
  contractStart: DateValue,
  contractEnd: DateValue,
  contractPeriods: readonly ContractPeriodDates[] = [],
): number | null {
  const hasContractPeriods = contractPeriods.length > 0;
  const contractDays = hasContractPeriods
    ? contractPeriods.reduce((total, period) => {
        const days = calendarDay(period.contractToDate) - calendarDay(period.contractFromDate);
        return days >= 0 ? total + days : NaN;
      }, 0)
    : calendarDay(contractEnd) - calendarDay(contractStart);
  if (!(contractDays > 0)) return null;

  const ranges = periods
    .map(({ startDate, endDate }) => ({ start: calendarDay(startDate), end: calendarDay(endDate) }))
    .filter(({ start, end }) => end >= start)
    .sort((left, right) => left.start - right.start);
  if (ranges.length === 0) return null;

  if (hasContractPeriods) {
    const participationDays = ranges.reduce((total, { start, end }) => total + end - start, 0);
    return Math.trunc((participationDays * 100) / contractDays) / 100;
  }

  let participationDays = 0;
  let coveredUntil = ranges[0].start;
  for (const { start, end } of ranges) {
    participationDays += Math.max(0, end - Math.max(start, coveredUntil));
    coveredUntil = Math.max(coveredUntil, end);
  }
  return Math.trunc((participationDays * 100) / contractDays) / 100;
}

export function calculateHistoryParticipationRatios<Row extends ParticipationDates & {
  contractFromDate?: DateValue;
  contractToDate?: DateValue;
  contractPeriods?: readonly ContractPeriodDates[];
}>(groups: ReadonlyMap<string, readonly Row[]>) {
  return new Map(Array.from(groups, ([key, rows]) => [
    key, calculateParticipationRatio(rows, rows[0]?.contractFromDate, rows[0]?.contractToDate, rows[0]?.contractPeriods),
  ]));
}
