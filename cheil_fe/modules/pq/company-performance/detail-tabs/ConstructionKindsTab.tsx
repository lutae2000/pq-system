"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  type DataGridProps,
  type GridColDef,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { EnterpriseDataGrid, type EnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { listConstructionTypes, type ConstructionTypeRecord } from "@/modules/code/construction-types/api";
import {
  createCompanyPerformanceConstructionKind,
  deleteCompanyPerformanceConstructionKind,
  listCompanyPerformanceConstructionKinds,
  updateCompanyPerformanceConstructionKind,
  type CompanyPerformanceConstructionKindRecord,
  type CompanyPerformanceConstructionKindRequest,
  type CompanyPerformanceRecord,
} from "@/modules/pq/company-performance/api";
import { displayBlank, displayTarget, tempId, text, type CodeOption } from "@/modules/pq/company-performance/detail-tabs/detailTabUtils";

type ConstructionKindsTabProps = {
  readOnly?: boolean;
  record: CompanyPerformanceRecord;
  requestConfirmation: (action: EnterpriseRowActionConfirm) => void;
};

const constructionTypePathKey = (...codes: Array<string | null | undefined>) => codes.map(text).join("\u0000");

const constructionTypeOptionLabel = (code: string, label: string) => (label ? `${code} - ${label}` : code);

const sortConstructionKindRows = (
  left: CompanyPerformanceConstructionKindRecord,
  right: CompanyPerformanceConstructionKindRecord,
) =>
  text(left.level1Code).localeCompare(text(right.level1Code)) ||
  text(left.level2Code).localeCompare(text(right.level2Code)) ||
  text(left.level3Code).localeCompare(text(right.level3Code)) ||
  Number(left.id) - Number(right.id);

const toConstructionKindRequest = (
  row: CompanyPerformanceConstructionKindRecord,
): CompanyPerformanceConstructionKindRequest => ({
  level1Code: text(row.level1Code) || null,
  level2Code: text(row.level2Code) || null,
  level3Code: text(row.level3Code) || null,
});

export function ConstructionKindsTab({ readOnly = false, record, requestConfirmation }: ConstructionKindsTabProps) {
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const [newRows, setNewRows] = useState<CompanyPerformanceConstructionKindRecord[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const constructionKindsQuery = useQuery({
    queryKey: ["company-performance-construction-kinds", record.seq],
    queryFn: () => listCompanyPerformanceConstructionKinds(record.seq),
    enabled: Boolean(record.seq),
  });

  const constructionTypesQuery = useQuery({
    queryKey: ["construction-types", "company-performance", "useYn=true"],
    queryFn: () => listConstructionTypes({ useYn: "Y" }),
  });

  const constructionTypeRecords = useMemo<ConstructionTypeRecord[]>(
    () =>
      [...(constructionTypesQuery.data ?? [])].sort(
        (left, right) =>
          left.codeLevel - right.codeLevel ||
          text(left.level1Code).localeCompare(text(right.level1Code)) ||
          text(left.level2Code).localeCompare(text(right.level2Code)) ||
          text(left.level3Code).localeCompare(text(right.level3Code)) ||
          text(left.codeName).localeCompare(text(right.codeName)),
      ),
    [constructionTypesQuery.data],
  );

  const level1Options = useMemo<CodeOption[]>(() => {
    const options = new Map<string, string>();
    for (const code of constructionTypeRecords) {
      if (code.codeLevel === 1 && code.level1Code && !options.has(code.level1Code)) {
        options.set(code.level1Code, code.codeName);
      }
    }
    return Array.from(options, ([value, label]) => ({ label: constructionTypeOptionLabel(value, label), value }));
  }, [constructionTypeRecords]);

  const level2Options = useMemo<CodeOption[]>(() => {
    const options = new Map<string, CodeOption>();
    for (const code of constructionTypeRecords) {
      const key = constructionTypePathKey(code.level1Code, code.level2Code);
      if (code.codeLevel === 2 && code.level2Code && !options.has(key)) {
        options.set(key, {
          label: constructionTypeOptionLabel(code.level2Code, code.codeName),
          level1Code: code.level1Code,
          value: code.level2Code,
        });
      }
    }
    return [...options.values()];
  }, [constructionTypeRecords]);

  const level3Options = useMemo<CodeOption[]>(() => {
    const options = new Map<string, CodeOption>();
    for (const code of constructionTypeRecords) {
      const key = constructionTypePathKey(code.level1Code, code.level2Code, code.level3Code);
      if (code.codeLevel === 3 && code.level3Code && !options.has(key)) {
        options.set(key, {
          label: constructionTypeOptionLabel(code.level3Code, code.codeName || code.level3Code),
          level1Code: code.level1Code,
          level2Code: code.level2Code,
          value: code.level3Code,
        });
      }
    }
    return [...options.values()];
  }, [constructionTypeRecords]);

  const level1LabelByCode = useMemo(
    () => new Map(level1Options.map((option) => [String(option.value), option.label])),
    [level1Options],
  );

  const level2LabelByPath = useMemo(() => {
    const labels = new Map<string, string>();
    for (const code of constructionTypeRecords) {
      if (code.codeLevel === 2 && code.level2Code) {
        labels.set(constructionTypePathKey(code.level1Code, code.level2Code), constructionTypeOptionLabel(code.level2Code, code.codeName));
      }
    }
    return labels;
  }, [constructionTypeRecords]);

  const level3LabelByPath = useMemo(() => {
    const labels = new Map<string, string>();
    for (const code of constructionTypeRecords) {
      if (code.codeLevel === 3 && code.level3Code) {
        labels.set(
          constructionTypePathKey(code.level1Code, code.level2Code, code.level3Code),
          constructionTypeOptionLabel(code.level3Code, code.codeName),
        );
      }
    }
    return labels;
  }, [constructionTypeRecords]);

  const rows = useMemo(
    () => [...newRows, ...(constructionKindsQuery.data ?? [])].sort(sortConstructionKindRows),
    [constructionKindsQuery.data, newRows],
  );

  const invalidateConstructionKinds = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["company-performance-construction-kinds", record.seq] }),
    [queryClient, record.seq],
  );

  const saveMutation = useMutation({
    mutationFn: async (row: CompanyPerformanceConstructionKindRecord) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 공사종류를 등록할 수 있습니다.");
      }
      if (row.isNew && !canCreate) {
        throw new Error("공사종류를 등록할 권한이 없습니다.");
      }
      if (!row.isNew && !canUpdate) {
        throw new Error("공사종류를 수정할 권한이 없습니다.");
      }
      if (!text(row.level1Code) || !text(row.level2Code) || !text(row.level3Code)) {
        throw new Error("공사종류 1/2/3레벨 코드는 필수입니다.");
      }
      const requestBody = toConstructionKindRequest(row);
      return row.isNew
        ? createCompanyPerformanceConstructionKind(record.seq, requestBody)
        : updateCompanyPerformanceConstructionKind(record.seq, row.id, requestBody);
    },
    onSuccess: (_saved, row) => {
      setNewRows((current) => current.filter((item) => item.id !== row.id));
      void invalidateConstructionKinds();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!record.seq) {
        throw new Error("회사 실적 저장 후 공사종류를 삭제할 수 있습니다.");
      }
      if (!canDelete) {
        throw new Error("공사종류를 삭제할 권한이 없습니다.");
      }
      return deleteCompanyPerformanceConstructionKind(record.seq, id);
    },
    onSuccess: () => {
      void invalidateConstructionKinds();
    },
  });

  const confirmProcessRowUpdate = useCallback(
    (row: CompanyPerformanceConstructionKindRecord): Omit<EnterpriseRowActionConfirm, "onConfirm"> => ({
        confirmColor: "primary",
        confirmLabel: row.isNew ? "등록" : "수정",
        message: row.isNew ? "공사종류를 등록하시겠습니까?" : "공사종류를 수정하시겠습니까?",
        targetLabel: displayTarget(
          [row.level1Code, row.level2Code, row.level3Code].filter(Boolean).join(" / "),
          row.isNew ? "신규 공사종류" : String(row.id),
        ),
        title: row.isNew ? "공사종류 등록" : "공사종류 수정",
      }),
    [],
  );

  const confirmDeleteRow = useCallback(
    (row: CompanyPerformanceConstructionKindRecord) => {
      requestConfirmation({
        confirmColor: "error",
        confirmLabel: "삭제",
        message: "공사종류를 삭제하시겠습니까?",
        targetLabel: displayTarget([row.level1Code, row.level2Code, row.level3Code].filter(Boolean).join(" / "), String(row.id)),
        title: "공사종류 삭제",
        onConfirm: () => deleteMutation.mutateAsync(row.id),
      });
    },
    [deleteMutation, requestConfirmation],
  );

  const addRow = () => {
    const id = tempId();
    const newRow: CompanyPerformanceConstructionKindRecord = {
      id,
      isNew: true,
      level1Code: "",
      level2Code: "",
      level3Code: "",
      seq: record.seq,
    };
    setNewRows((current) => [newRow, ...current]);
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit, fieldToFocus: "level1Code" } }));
  };

  const handleRowEditStop: NonNullable<DataGridProps<CompanyPerformanceConstructionKindRecord>["onRowEditStop"]> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
      return;
    }

    if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
      setNewRows((current) => current.filter((row) => row.id !== params.id));
    }
  };

  const handleNewRowEditCancel = (
    row: CompanyPerformanceConstructionKindRecord,
    params: { reason?: GridRowEditStopReasons },
  ) => {
    if (params.reason !== GridRowEditStopReasons.rowFocusOut || !row.isNew) {
      return;
    }

    if (text(row.level1Code) || text(row.level2Code) || text(row.level3Code)) {
      return false;
    }

    setRowModesModel((current) => {
      const next = { ...current };
      delete next[String(row.id)];
      return next;
    });
    setNewRows((current) => current.filter((item) => item.id !== row.id));
    return true;
  };

  const columns = useMemo<GridColDef<CompanyPerformanceConstructionKindRecord>[]>(
    () => [
      {
        field: "level1Code",
        headerName: "1레벨",
        width: 170,
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        rowSpanValueGetter: (_value, row) => text(row.level1Code),
        renderCell: (params) => level1LabelByCode.get(text(params.row.level1Code)) ?? displayBlank(params.row.level1Code),
        type: "singleSelect",
        valueOptions: level1Options,
      },
      {
        field: "level2Code",
        headerName: "2레벨",
        width: 170,
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        rowSpanValueGetter: (_value, row) => constructionTypePathKey(row.level1Code, row.level2Code),
        renderCell: (params) =>
          level2LabelByPath.get(constructionTypePathKey(params.row.level1Code, params.row.level2Code)) ?? displayBlank(params.row.level2Code),
        type: "singleSelect",
        valueOptions: ({ row }) =>
          row ? level2Options.filter((option) => !text(row.level1Code) || option.level1Code === text(row.level1Code)) : level2Options,
      },
      {
        field: "level3Code",
        headerName: "3레벨",
        minWidth: 190,
        flex: 1,
        editable: true,
        getOptionLabel: (option) => String((option as CodeOption).label ?? option),
        getOptionValue: (option) => (option as CodeOption).value ?? option,
        renderCell: (params) =>
          level3LabelByPath.get(constructionTypePathKey(params.row.level1Code, params.row.level2Code, params.row.level3Code)) ??
          displayBlank(params.row.level3Code),
        type: "singleSelect",
        valueOptions: ({ row }) =>
          row
            ? level3Options.filter(
                (option) =>
                  (!text(row.level1Code) || option.level1Code === text(row.level1Code)) &&
                  (!text(row.level2Code) || option.level2Code === text(row.level2Code)),
              )
            : level3Options,
      },
      {
        field: "actions",
        type: "actions",
        headerName: "관리",
        width: 96,
        getActions: (params) => {
          const rowIsEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;
          if (rowIsEditing) {
            return [
              <GridActionsCellItem
                color="primary"
                disabled={params.row.isNew ? !canCreate : !canUpdate}
                icon={<SaveOutlinedIcon />}
                key="save"
                label="저장"
                onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View } }))}
              />,
              <GridActionsCellItem
                color="inherit"
                icon={<CancelOutlinedIcon />}
                key="cancel"
                label="취소"
                onClick={() => {
                  setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
                  if (params.row.isNew) {
                    setNewRows((current) => current.filter((row) => row.id !== params.row.id));
                  }
                }}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              color="inherit"
              disabled={!canUpdate}
              icon={<EditOutlinedIcon />}
              key="edit"
              label="수정"
              onClick={() => setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.Edit } }))}
            />,
            <GridActionsCellItem
              color="inherit"
              disabled={!canDelete || deleteMutation.isPending || params.row.isNew}
              icon={<DeleteOutlineOutlinedIcon />}
              key="delete"
              label="삭제"
              onClick={() => confirmDeleteRow(params.row)}
            />,
          ];
        },
      },
    ],
    [
      canCreate,
      canDelete,
      canUpdate,
      confirmDeleteRow,
      deleteMutation.isPending,
      level1LabelByCode,
      level1Options,
      level2LabelByPath,
      level2Options,
      level3LabelByPath,
      level3Options,
      rowModesModel,
    ],
  );

  const processRowUpdate = async (updatedRow: CompanyPerformanceConstructionKindRecord) => {
    if (readOnly) {
      return updatedRow;
    }
    const saved = await saveMutation.mutateAsync(updatedRow);
    return saved;
  };
  const gridColumns = useMemo(
    () => (readOnly ? columns.filter((column) => column.type !== "actions") : columns),
    [columns, readOnly],
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button disabled={readOnly || !canCreate || !record.seq || saveMutation.isPending} onClick={addRow} size="small" startIcon={<AddOutlinedIcon />} sx={{ display: readOnly ? "none" : undefined }} variant="outlined">
          추가
        </Button>
      </Box>
      <EnterpriseDataGrid<CompanyPerformanceConstructionKindRecord>
        columns={gridColumns}
        confirmProcessRowUpdate={readOnly ? undefined : confirmProcessRowUpdate}
        editMode={readOnly ? undefined : "row"}
        getRowId={(row) => row.id}
        isNewRow={(row) => row.isNew === true}
        hideFooterSelectedRowCount
        loading={
          constructionKindsQuery.isLoading ||
          constructionKindsQuery.isFetching ||
          constructionTypesQuery.isLoading ||
          constructionTypesQuery.isFetching ||
          saveMutation.isPending ||
          deleteMutation.isPending
        }
        onProcessRowUpdateError={() => undefined}
        onNewRowEditCancel={readOnly ? undefined : handleNewRowEditCancel}
        onRowEditStop={readOnly ? undefined : handleRowEditStop}
        onRowModesModelChange={readOnly ? undefined : setRowModesModel}
        processRowUpdate={readOnly ? undefined : processRowUpdate}
        readOnly={readOnly}
        rowHeight={34}
        rowModesModel={readOnly ? undefined : rowModesModel}
        rowSpanning
        rows={rows}
        showPageNumbers
        showToolbar={false}
        wrapperMinHeight={475}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
        }}
      />
    </Box>
  );
}
