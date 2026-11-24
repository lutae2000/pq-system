import { parseDateInput } from "@/modules/common/formatters";

export type ParticipationContractPeriod = {
  fromDate: string | null;
  toDate: string | null;
};

function calendarDay(value: string | null | undefined) {
  const date = parseDateInput(value ?? "", "date");
  return date ? Date.parse(`${date}T00:00:00Z`) / 86_400_000 : NaN;
}

export function calculateParticipationRatio(
  participationStart: string | null | undefined,
  participationEnd: string | null | undefined,
  contractStart: string | null | undefined,
  contractEnd: string | null | undefined,
): number | null {
  const participationDays = calendarDay(participationEnd) - calendarDay(participationStart);
  const contractDays = calendarDay(contractEnd) - calendarDay(contractStart);
  if (!(participationDays >= 0 && contractDays > 0)) return null;
  return Math.trunc((participationDays * 100) / contractDays) / 100;
}

export function calculateHistoryParticipationRatio(row: {
  startDate: string | null;
  endDate: string | null;
  participationContractPeriod?: ParticipationContractPeriod | null;
}): number | null {
  return calculateParticipationRatio(
    row.startDate,
    row.endDate,
    row.participationContractPeriod?.fromDate,
    row.participationContractPeriod?.toDate,
  );
}
