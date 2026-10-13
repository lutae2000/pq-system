"use client";

import { TextField } from "@mui/material";

import {
  CheckboxListInput,
  standardFieldSx,
  type CheckboxOption,
} from "@/components/common/FormControls";
import type { G2bBidNoticeCandidateSearchFilters } from "@/modules/pq/g2b-bid-notice-candidates/domain/models";

type Props = {
  filters: G2bBidNoticeCandidateSearchFilters;
  onChange: (field: keyof G2bBidNoticeCandidateSearchFilters, value: string | string[]) => void;
};

const textFields: { field: "bidNtceNm" | "ntceInsttNm" | "befBidBbancNo"; label: string }[] = [
  { field: "bidNtceNm", label: "입찰공고명" },
  { field: "ntceInsttNm", label: "공고기관명" },
  { field: "befBidBbancNo", label: "이전 입찰번호" },
];

const noticeKindOptions: CheckboxOption<string>[] = [
  { label: "변경공고", value: "변경공고" },
  { label: "등록공고", value: "등록공고" },
  { label: "재공고", value: "재공고" },
  { label: "취소공고", value: "취소공고" },
];

const importedOptions: CheckboxOption<string>[] = [
  { label: "미반영", value: "N" },
  { label: "반영", value: "Y" },
];
const serviceDivisionOptions: CheckboxOption<string>[] = [
  { label: "기술용역", value: "기술용역" },
  { label: "일반용역", value: "일반용역" },
];

const contractMethodOptions: CheckboxOption<string>[] = [
  { label: "일반경쟁", value: "일반경쟁" },
  { label: "제한경쟁", value: "제한경쟁" },
  { label: "지명경쟁", value: "지명경쟁" },
  { label: "수의계약", value: "수의계약" },
];

export function G2bBidNoticeCandidateFilters({ filters, onChange }: Props) {
  return (
    <>
      <CheckboxListInput
        label="공고구분"
        name="ntceKindNm"
        onChange={(name, value) => onChange(name as "ntceKindNm", value)}
        options={noticeKindOptions}
        value={filters.ntceKindNm}
      />
      <CheckboxListInput
        label="공고문 반영"
        name="importedYn"
        onChange={(name, value) => onChange(name as "importedYn", value)}
        options={importedOptions}
        value={filters.importedYn}
      />
      <CheckboxListInput
        label="용역구분"
        name="srvceDivNm"
        onChange={(name, value) => onChange(name as "srvceDivNm", value)}
        options={serviceDivisionOptions}
        value={filters.srvceDivNm}
      />
      <CheckboxListInput
        label="계약구분"
        name="cntrctCnclsMthdNm"
        onChange={(name, value) => onChange(name as "cntrctCnclsMthdNm", value)}
        options={contractMethodOptions}
        value={filters.cntrctCnclsMthdNm}
      />
      {textFields.map(({ field, label }) => (
        <TextField
          key={field}
          label={label}
          onChange={(event) => onChange(field, event.target.value)}
          size="small"
          sx={standardFieldSx}
          value={filters[field]}
        />
      ))}
    </>
  );
}
