import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { EngineerProjectHistoryReviewRecord } from "@/modules/pq/engineer-performance-docs/api";

type ReviewResultsByEngineer = {
  engineerId: string;
  results: EngineerProjectHistoryReviewRecord[];
};

const reviewHeaders = [
  "순번",
  "용역명",
  "발주처",
  "계약금액",
  "자사금액",
  "계약시작",
  "계약종료",
  "참여시작",
  "참여종료",
  "담당업무",
  "전문분야",
  "신고여부",
];

const text = (value: string | number | null | undefined) => String(value ?? "").trim();

const formatMoney = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString("ko-KR") : String(value);
};

const formatDateYmd = (value: string | number | null | undefined) => {
  const raw = text(value);
  if (!raw) {
    return "";
  }

  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : raw;
};

const createUniqueSheetName = (name: string, usedNames: Set<string>) => {
  const baseName = (name || "기술인").replace(/[\\/:?*\[\]]/g, " ").trim().slice(0, 31) || "기술인";
  let sheetName = baseName;
  let suffix = 2;

  while (usedNames.has(sheetName)) {
    const suffixText = ` (${suffix})`;
    sheetName = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  usedNames.add(sheetName);
  return sheetName;
};

const toReviewExportRow = (row: EngineerProjectHistoryReviewRecord) => [
  row.displayOrder ?? "",
  text(row.jobName),
  text(row.orderClient),
  formatMoney(row.contractAmt),
  formatMoney(row.ownAmt),
  formatDateYmd(row.contractFromDate),
  formatDateYmd(row.contractToDate),
  formatDateYmd(row.startDate),
  formatDateYmd(row.endDate),
  text(row.duty),
  text(row.proPart),
  text(row.returnYn),
];

export async function downloadEngineerPerformanceReviewWorkbook({
  profiles,
  projectName,
  reviewResultsByEngineer,
}: {
  profiles: EngineerProfile[];
  projectName: string;
  reviewResultsByEngineer: ReviewResultsByEngineer[];
}) {
  const xlsx = await import("xlsx");
  const workbook = xlsx.utils.book_new();
  const usedSheetNames = new Set<string>();

  for (const profile of profiles) {
    const results = reviewResultsByEngineer.find((item) => item.engineerId === profile.summary.id)?.results ?? [];
    const worksheetRows = [reviewHeaders, ...results.map(toReviewExportRow)];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetRows);
    const sheetName = createUniqueSheetName(profile.summary.name, usedSheetNames);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const fileData = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${text(projectName) || "기술인실적"}_기술인검토결과.xlsx`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
