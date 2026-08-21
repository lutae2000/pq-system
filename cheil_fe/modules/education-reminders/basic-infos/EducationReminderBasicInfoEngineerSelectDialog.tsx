"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { DepartmentSelect } from "@/components/common/reference-selects/ReferenceSelects";
import { formatReferenceLabel } from "@/modules/common/reference/referenceFormat";
import { useCommonCodeLevel2Options, useCommonCodeLevel3Options, useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";
import { listEngineerProfiles, type EngineerProfileListFilters } from "@/modules/pq/engineers/api";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

type EducationReminderBasicInfoEngineerSelectDialogProps = {
  assignedEngineerIds: string[];
  open: boolean;
  onClose: () => void;
  onSave: (engineerIds: string[]) => void;
};

type EngineerRow = {
  constructionManagementGrade: string;
  department: string;
  designGrade: string;
  engineerId: string;
  jobField: string;
  name: string;
  position: string;
  specialtyField: string;
  status: string;
};

type CodeOption = { label: string; value: string };

type EngineerSelectFilters = {
  constructionManagementGrade: string;
  department: string;
  designGrade: string;
  jobField: string;
  specialtyField: string;
};

const emptyFilters = (): EngineerSelectFilters => ({
  constructionManagementGrade: "",
  department: "",
  designGrade: "",
  jobField: "",
  specialtyField: "",
});

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INITIAL_PAGE_SIZE = 25;

const toRow = (profile: EngineerProfile): EngineerRow => ({
  constructionManagementGrade: profile.detail.supervisionQualification ?? "",
  department: profile.summary.department ?? "",
  designGrade: profile.detail.technicalField ?? "",
  engineerId: profile.summary.id,
  jobField: profile.summary.workField ?? "",
  name: profile.summary.name ?? "",
  position: profile.summary.position ?? "",
  specialtyField: profile.summary.specialtyField ?? "",
  status: profile.summary.status ?? "",
});

const matchesKeyword = (row: EngineerRow, keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.engineerId, row.name, row.department, row.position, row.jobField, row.specialtyField, row.status].some((value) =>
    value.toLowerCase().includes(normalized),
  );
};

export function EducationReminderBasicInfoEngineerSelectDialog({
  assignedEngineerIds,
  open,
  onClose,
  onSave,
}: EducationReminderBasicInfoEngineerSelectDialogProps) {
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<EngineerSelectFilters>(() => emptyFilters());
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ ids: new Set<string>(), type: "include" });
  const gradeReferences = useCommonCodeLevel2Options("52", { useYn: "Y" }, { enabled: open });
  const jobFieldReferences = useCommonCodeLevel3Options("PQ", "QA", { useYn: "Y" }, { enabled: open });
  const specialtyFieldReferences = useCommonCodeLevel3Options("PQ", "PA", { useYn: "Y" }, { enabled: open });
  const departmentReferences = useDepartmentOptions({ useYn: true }, { enabled: open });

  const gradeOptions = useMemo<CodeOption[]>(
    () => gradeReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [gradeReferences.options],
  );
  const jobFieldOptions = useMemo<CodeOption[]>(
    () => jobFieldReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [jobFieldReferences.options],
  );
  const specialtyFieldOptions = useMemo<CodeOption[]>(
    () => specialtyFieldReferences.options.map((option) => ({ label: option.label, value: option.value })),
    [specialtyFieldReferences.options],
  );
  const engineerQueryFilters = useMemo<EngineerProfileListFilters>(
    () => ({
      constructionManagementGrade: filters.constructionManagementGrade || undefined,
      department: departmentReferences.labelByValue[filters.department] || undefined,
      designGrade: filters.designGrade || undefined,
      jobField: filters.jobField || undefined,
      retireYn: "N",
      specialtyField: filters.specialtyField || undefined,
    }),
    [departmentReferences.labelByValue, filters],
  );

  const engineersQuery = useQuery({
    queryKey: ["pq-engineers", "education-reminder-basic-info-assign", engineerQueryFilters],
    queryFn: () => listEngineerProfiles(engineerQueryFilters),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setKeyword("");
      setFilters(emptyFilters());
      setRowSelectionModel({ ids: new Set<string>(), type: "include" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [assignedEngineerIds, open]);

  const assignedEngineerIdSet = useMemo(() => new Set(assignedEngineerIds), [assignedEngineerIds]);
  const filteredRows = useMemo(
    () =>
      (engineersQuery.data ?? [])
        .map(toRow)
        .filter((row) => !assignedEngineerIdSet.has(row.engineerId))
        .filter((row) => matchesKeyword(row, keyword)),
    [assignedEngineerIdSet, engineersQuery.data, keyword],
  );

  const jobFieldLabelByValue = jobFieldReferences.labelByValue;
  const specialtyFieldLabelByValue = specialtyFieldReferences.labelByValue;
  const gradeLabelByValue = gradeReferences.labelByValue;

  const selectedCount = useMemo(() => {
    const ids = rowSelectionModel.ids as Set<string>;
    return ids.size;
  }, [rowSelectionModel.ids]);

  const columns = useMemo<GridColDef<EngineerRow>[]>(
    () => [
      { field: "engineerId", headerName: "기술인ID", width: 120 },
      { field: "name", headerName: "성명", width: 110 },
      { field: "department", headerName: "부서", minWidth: 150, flex: 1 },
      { field: "position", headerName: "직위", width: 100 },
      {
        field: "jobField",
        headerName: "직무분야",
        width: 140,
        valueGetter: (_value, row) => formatReferenceLabel(jobFieldLabelByValue, row.jobField),
      },
      {
        field: "specialtyField",
        headerName: "전문분야",
        width: 140,
        valueGetter: (_value, row) => formatReferenceLabel(specialtyFieldLabelByValue, row.specialtyField),
      },
      {
        field: "designGrade",
        headerName: "설계등급",
        width: 110,
        valueGetter: (_value, row) => formatReferenceLabel(gradeLabelByValue, row.designGrade),
      },
      {
        field: "constructionManagementGrade",
        headerName: "건설사업관리 등급",
        width: 150,
        valueGetter: (_value, row) => formatReferenceLabel(gradeLabelByValue, row.constructionManagementGrade),
      },
      {
        field: "status",
        headerName: "상태",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => <Chip label={String(value)} size="small" variant="outlined" />,
      },
    ],
    [gradeLabelByValue, jobFieldLabelByValue, specialtyFieldLabelByValue],
  );

  return (
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            교육 알림 할당 기술인 선택
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="검색"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="기술인ID, 성명, 부서, 직위, 직무분야, 전문분야"
            size="small"
            sx={{ ...standardFieldSx, maxWidth: 420 }}
            value={keyword}
          />

          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" } }}>
            <DepartmentSelect
              includeAll
              label="부서"
              onChange={(value) => setFilters((current) => ({ ...current, department: value === "All" ? "" : value }))}
              value={filters.department}
            />
            <Autocomplete<CodeOption>
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, option) => setFilters((current) => ({ ...current, jobField: option?.value ?? "" }))}
              options={jobFieldOptions}
              value={jobFieldOptions.find((option) => option.value === filters.jobField) ?? null}
              renderInput={(params) => <TextField {...params} label="직무분야" size="small" sx={standardFieldSx} />}
            />
            <Autocomplete<CodeOption>
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, option) => setFilters((current) => ({ ...current, specialtyField: option?.value ?? "" }))}
              options={specialtyFieldOptions}
              value={specialtyFieldOptions.find((option) => option.value === filters.specialtyField) ?? null}
              renderInput={(params) => <TextField {...params} label="전문분야" size="small" sx={standardFieldSx} />}
            />
            <Autocomplete<CodeOption>
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, option) => setFilters((current) => ({ ...current, designGrade: option?.value ?? "" }))}
              options={gradeOptions}
              value={gradeOptions.find((option) => option.value === filters.designGrade) ?? null}
              renderInput={(params) => <TextField {...params} label="설계등급" size="small" sx={standardFieldSx} />}
            />
            <Autocomplete<CodeOption>
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, option) => setFilters((current) => ({ ...current, constructionManagementGrade: option?.value ?? "" }))}
              options={gradeOptions}
              value={gradeOptions.find((option) => option.value === filters.constructionManagementGrade) ?? null}
              renderInput={(params) => <TextField {...params} label="건설사업관리 등급" size="small" sx={standardFieldSx} />}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`전체 ${filteredRows.length}명`} variant="outlined" />
            <Chip color="primary" label={`선택 ${selectedCount}명`} variant={selectedCount > 0 ? "filled" : "outlined"} />
          </Box>

          <EnterpriseDataGrid<EngineerRow>
            columns={columns}
            getRowId={(row) => row.engineerId}
            hideFooterSelectedRowCount
            checkboxSelection
            loading={engineersQuery.isLoading || engineersQuery.isFetching}
            onRowSelectionModelChange={(model) => setRowSelectionModel(model)}
            rowSelectionModel={rowSelectionModel}
            rows={filteredRows}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: INITIAL_PAGE_SIZE,
                },
              },
            }}
            showPageNumbers
            wrapperMinHeight={420}
            sx={{
              height: 420,
              minWidth: 0,
              width: "100%",
              "& .MuiDataGrid-row:hover": {
                cursor: "pointer",
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} startIcon={<CloseOutlinedIcon />} variant="outlined">
          취소
        </Button>
        <Button
          onClick={() => onSave(Array.from(rowSelectionModel.ids as Set<string>))}
          startIcon={<CheckOutlinedIcon />}
          variant="contained"
        >
          추가
        </Button>
      </DialogActions>
    </Dialog>
  );
}
