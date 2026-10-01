import { Checkbox, Chip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import type { PqParticipatingEngineerCandidate } from "@/modules/pq/pq-participating-engineers/api";
import type { SelectedPqEngineer } from "@/modules/pq/pq-participating-engineers/domain/models";
import type { EngineerStatus } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

export type SelectionClickEvent = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

type CandidateColumnParams = {
  allSelected: boolean;
  candidatesCount: number;
  labelByGrade: Record<string, string>;
  labelByJobField: Record<string, string>;
  labelBySpecialtyField: Record<string, string>;
  onSelect: (id: string, event?: SelectionClickEvent, source?: "row" | "checkbox") => void;
  onToggleAll: (checked: boolean) => void;
  selectedIds: Set<string>;
  someSelected: boolean;
};

type SelectedColumnParams = {
  allSelected: boolean;
  engineersCount: number;
  labelByJobField: Record<string, string>;
  labelBySpecialtyField: Record<string, string>;
  onSelect: (id: string, event?: SelectionClickEvent, source?: "row" | "checkbox") => void;
  onToggleAll: (checked: boolean) => void;
  selectedIds: Set<string>;
  someSelected: boolean;
};

const checkboxSx = { p: 0, "& .MuiSvgIcon-root": { fontSize: 18 } } as const;

const formatBirthDate = (value: string | null | undefined) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return value ?? "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const formatStatusChip = (status: EngineerStatus) => {
  const color = status === "재직" ? "success" : status === "퇴직" ? "warning" : "default";
  return <Chip color={color} label={status} size="small" variant={status === "재직" ? "filled" : "outlined"} />;
};

export function createCandidateEngineerColumns({
  allSelected,
  candidatesCount,
  labelByGrade,
  labelByJobField,
  labelBySpecialtyField,
  onSelect,
  onToggleAll,
  selectedIds,
  someSelected,
}: CandidateColumnParams): GridColDef<PqParticipatingEngineerCandidate>[] {
  return [
    {
      field: "__select__",
      headerName: "선택",
      width: 64,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox checked={allSelected} disabled={candidatesCount === 0} indeterminate={!allSelected && someSelected} onChange={(event) => onToggleAll(event.target.checked)} size="small" sx={checkboxSx} />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedIds.has(params.row.engrId)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(params.row.engrId, event, "checkbox");
          }}
          size="small"
          sx={checkboxSx}
        />
      ),
    },
    { field: "name", headerName: "성명", width: 100, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.name ?? "" },
    { field: "position", headerName: "직위", width: 90, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.position ?? "" },
    { field: "jobField", headerName: "직무분야", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.jobField ?? "", valueFormatter: (value) => formatReferenceLabel(labelByJobField, value) },
    { field: "specialtyField", headerName: "전문분야", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.specialtyField ?? "", valueFormatter: (value) => formatReferenceLabel(labelBySpecialtyField, value) },
    { field: "designGrade", headerName: "설계등급", flex: 1, minWidth: 110, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.designGrade ?? "", valueFormatter: (value) => formatReferenceLabel(labelByGrade, value) },
  ];
}

export function createSelectedEngineerColumns({
  allSelected,
  engineersCount,
  labelByJobField,
  labelBySpecialtyField,
  onSelect,
  onToggleAll,
  selectedIds,
  someSelected,
}: SelectedColumnParams): GridColDef<SelectedPqEngineer>[] {
  return [
    {
      field: "__select__",
      headerName: "선택",
      width: 64,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox checked={allSelected} disabled={engineersCount === 0} indeterminate={!allSelected && someSelected} onChange={(event) => onToggleAll(event.target.checked)} size="small" sx={checkboxSx} />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedIds.has(params.row.engineerId)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(params.row.engineerId, event, "checkbox");
          }}
          size="small"
          sx={checkboxSx}
        />
      ),
    },
    { field: "priority", headerName: "순번", width: 70, align: "center", headerAlign: "center" },
    { field: "name", headerName: "성명", width: 100, align: "center", headerAlign: "center" },
    { field: "birthDate", headerName: "생년월일", width: 120, align: "center", headerAlign: "center", valueGetter: (_value, row) => formatBirthDate(row.birthDate) },
    { field: "department", headerName: "부서", minWidth: 100, flex: 0.8, align: "center", headerAlign: "center" },
    { field: "title", headerName: "직위", width: 90, align: "center", headerAlign: "center" },
    { field: "jobField", headerName: "직무분야", width: 120, align: "center", headerAlign: "center", valueFormatter: (value) => formatReferenceLabel(labelByJobField, value) },
    { field: "specialtyField", headerName: "전문분야", width: 150, align: "center", headerAlign: "center", valueFormatter: (value) => formatReferenceLabel(labelBySpecialtyField, value) },
    { field: "status", headerName: "재직상태", width: 100, align: "center", headerAlign: "center", renderCell: (params) => formatStatusChip(params.value as EngineerStatus) },
  ];
}
