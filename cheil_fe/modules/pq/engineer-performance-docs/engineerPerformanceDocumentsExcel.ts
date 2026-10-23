import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { EngineerProjectHistoryReviewRecord } from "@/modules/pq/engineer-performance-docs/api";
import { formatPaddedLevel2CodeLabel } from "@/modules/common/reference/referenceFormat";
import { formatLocalizedNumber } from "@/modules/common/formatters";

type ReviewResultsByEngineer = {
  engineerId: string;
  results: EngineerProjectHistoryReviewRecord[];
};

const reviewHeaders = [
  "순번",
  "용역명",
  "참여당시 회사",
  "참여분야 직위",
  "참여당시 직위",
  "발주처",
  "계약금액",
  "자사금액",
  "지분율",
  "계약시작",
  "계약종료",
  "참여시작",
  "참여종료",
  "담당업무",
  "전문분야",
  "신고여부",
];

const text = (value: string | number | null | undefined) => String(value ?? "").trim();

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

const toReviewExportRow = (row: EngineerProjectHistoryReviewRecord, engLevelLabelByCode: Record<string, string>) => [
  row.displayOrder ?? "",
  text(row.jobName),
  text(row.compName),
  formatPaddedLevel2CodeLabel(engLevelLabelByCode, row.engLevel),
  text(row.grade),
  text(row.orderClient),
  formatLocalizedNumber(row.contractAmt, { emptyValue: "-" }),
  formatLocalizedNumber(row.ownAmt, { emptyValue: "-" }),
  row.divisionRate ?? "",
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
  engLevelLabelByCode,
}: {
  profiles: EngineerProfile[];
  projectName: string;
  reviewResultsByEngineer: ReviewResultsByEngineer[];
  engLevelLabelByCode: Record<string, string>;
}) {
  const { Workbook } = await import("exceljs-community/dist/exceljs.min.js");
  const workbook = new Workbook();
  const usedSheetNames = new Set<string>();

  for (const profile of profiles) {
    const results = reviewResultsByEngineer.find((item) => item.engineerId === profile.summary.id)?.results ?? [];
    const sheetName = createUniqueSheetName(profile.summary.name, usedSheetNames);
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.addRows([reviewHeaders, ...results.map((row) => toReviewExportRow(row, engLevelLabelByCode))]);
  }

  const fileData = await workbook.xlsx.writeBuffer();
  const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${text(projectName) || "기술인실적"}_기술인검토결과.xlsx`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
