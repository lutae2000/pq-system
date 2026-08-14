import { dateOnly, dateTimeText, formatMoney } from "@/modules/common/formatters";
import type { BidNoticeFilters, BidNoticePeriodType, BidNoticeRecord } from "@/modules/pq/bid-notice/bidNotice.types";

const periodOptions: { label: string; value: BidNoticePeriodType }[] = [
  { label: "공고기간", value: "NOTICE" },
  { label: "입찰기간", value: "BID" },
  { label: "PQ제출기간", value: "PQ" },
];

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

const localDateText = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const PRINT_ROWS_PER_PAGE = 11;

export type BidNoticePrintLabelMaps = {
  bidMethod?: Record<string, string>;
  bidType?: Record<string, string>;
  businessType?: Record<string, string>;
  department?: Record<string, string>;
  orderMethod?: Record<string, string>;
};

const resolveLabel = (value: string | null | undefined, labelMap?: Record<string, string>) => {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return "";
  }
  return labelMap?.[normalized] ?? normalized;
};

export const buildBidNoticePrintHtml = (
  records: BidNoticeRecord[],
  filters: BidNoticeFilters,
  labelMaps: BidNoticePrintLabelMaps = {},
) => {
  const periodLabel = periodOptions.find((option) => option.value === filters.periodType)?.label ?? "기간";
  const periodText = `${filters.periodStartDate || "전체"} ~ ${filters.periodEndDate || "전체"}`;
  const rowHtmlItems = records.length
    ? records
        .map(
          (record, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td class="center">${escapeHtml(dateOnly(record.noticeDate) || "-")}</td>
              <td class="left project-cell">${escapeHtml(record.projectName || "-")}<br/><span class="sub client-name">${escapeHtml(record.orderClientName || record.client || "-")}</span></td>
              <td class="right">${escapeHtml(formatMoney(Number(record.designAmt ?? record.estimateAmount ?? 0)))}<br/><span class="sub business-type">${escapeHtml(resolveLabel(record.businessType, labelMaps.businessType) || record.businessTypeLabel || "-")}</span></td>
              <td class="center">${escapeHtml(resolveLabel(record.procurementMethod, labelMaps.orderMethod) || record.orderMethodLabel || "-")}<br/><span class="sub">${escapeHtml(resolveLabel(record.bidType, labelMaps.bidType) || record.bidTypeLabel || "-")}</span></td>
              <td class="center">${escapeHtml(dateTimeText(record.pqRegistrationDate) || "-")}<br/><span class="sub">${escapeHtml(dateTimeText(record.pqSubmissionDate) || "-")}</span></td>
              <td class="center">${escapeHtml(resolveLabel(record.department, labelMaps.department) || record.departmentName || "-")}<br/><span class="sub">${escapeHtml(record.participationStatus || "-")} / ${escapeHtml(record.writerName || "-")}</span></td>
              <td class="center">${escapeHtml(record.bidSuccessYn === "Y" ? "낙찰" : "")}</td>
              <td class="left">${escapeHtml(record.draftNote || "-")}</td>
            </tr>
          `,
        )
    : [`<tr><td class="empty" colspan="9">조회 결과가 없습니다.</td></tr>`];
  const pageHtmlItems = Array.from({ length: Math.ceil(rowHtmlItems.length / PRINT_ROWS_PER_PAGE) }, (_, pageIndex) =>
    rowHtmlItems.slice(pageIndex * PRINT_ROWS_PER_PAGE, (pageIndex + 1) * PRINT_ROWS_PER_PAGE),
  );
  const totalPages = pageHtmlItems.length;
  const sheets = pageHtmlItems
    .map(
      (pageRows, pageIndex) => `
    <div class="sheet">
      <div class="header">
        <div style="width: 190px"></div>
        <div class="title">입찰공고현황</div>
        <div class="meta">
          <div>작업일 : ${escapeHtml(localDateText())}</div>
          <div>페이지 : ${pageIndex + 1} / ${totalPages}</div>
        </div>
      </div>
      <div class="period">기간 : ${escapeHtml(periodLabel)} ${escapeHtml(periodText)}</div>
      <table>
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th class="col-date">공고일</th>
            <th class="col-name">용역명<br/>발주처</th>
            <th class="col-amount">설계금액<br/>사업구분</th>
            <th class="col-method">발주방법<br/>입찰구분</th>
            <th class="col-pq">PQ등록일시<br/>PQ제출일시</th>
            <th class="col-dept">담당부서<br/>참여구분/등록자</th>
            <th class="col-success">낙찰여부</th>
            <th class="col-note">비고</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows.join("")}
        </tbody>
      </table>
    </div>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>입찰공고현황</title>
    <style>
      @page { size: landscape; margin: 10mm; }
      html, body { margin: 0; padding: 0; font-family: Arial, "Malgun Gothic", sans-serif; color: #111827; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { width: 100%; break-after: page; page-break-after: always; }
      .sheet:last-child { break-after: auto; page-break-after: auto; }
      .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
      .title { flex: 1; text-align: center; font-size: 24px; font-weight: 700; text-decoration: underline; letter-spacing: 0; margin-top: 2px; }
      .meta { min-width: 190px; font-size: 12px; line-height: 1.6; text-align: right; white-space: nowrap; }
      .period { font-size: 12px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #111; padding: 6px 5px; font-size: 11px; line-height: 1.25; vertical-align: top; word-break: break-word; }
      th { text-align: center; font-weight: 700; background: #fff; }
      td.center { text-align: center; }
      td.left { text-align: left; }
      td.right { text-align: right; }
      .sub { display: inline-block; margin-top: 2px; font-size: 10px; }
      .project-cell .client-name { margin-top: 5px; }
      .business-type { display: block; text-align: center; }
      .empty { text-align: center; padding: 20px 0; }
      .col-no { width: 25px; }
      .col-date { width: 60px; }
      .col-name { width: 290px; }
      .col-amount { width: 78px; }
      .col-method { width: 100px; }
      .col-pq { width: 80px; }
      .col-dept { width: 88px; }
      .col-success { width: 68px; }
      .col-note { width: 250px; }
    </style>
  </head>
  <body>
    ${sheets}
  </body>
</html>`;
};

export const openBidNoticePrintWindow = (
  records: BidNoticeRecord[],
  filters: BidNoticeFilters,
  labelMaps: BidNoticePrintLabelMaps = {},
  onError?: (message: string) => void,
) => {
  if (typeof window === "undefined") {
    return false;
  }

  const printWindow = window.open("", "_blank", "width=1400,height=900");
  if (!printWindow) {
    onError?.("인쇄 창을 열 수 없습니다.");
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildBidNoticePrintHtml(records, filters, labelMaps));
  printWindow.document.close();

  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);

  return true;
};
