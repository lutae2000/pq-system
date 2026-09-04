"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, FormControlLabel, IconButton, Switch, TextField, Tooltip, Typography } from "@mui/material";
import {
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  type DataGridProps,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EnterpriseDataGrid, useEnterpriseRowActionConfirm, type EnterpriseRowActionConfirm } from "@/components/common/EnterpriseDataGrid";
import { standardFieldSx } from "@/components/common/FormControls";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import {
  createCompanyPerformanceContractPeriod,
  deleteCompanyPerformanceContractPeriod,
  listCompanyPerformanceContractPeriods,
  updateCompanyPerformanceContractPeriod,
  type CompanyPerformanceContractPeriodRecord,
  type CompanyPerformanceContractPeriodRequest,
  type CompanyPerformanceRecord,
} from "@/modules/pq/company-performance/api";
import { tempId, text } from "@/modules/pq/company-performance/detail-tabs/detailTabUtils";

type CompanyPerformanceContractPeriodsGridProps = {
  readOnly?: boolean;
  record: CompanyPerformanceRecord;
};

const toDateInputValue = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}` : "";
};

const toYmdText = (value: string | null | undefined) => text(value).replace(/\D/g, "").slice(0, 8);

const toApiDateValue = (value: string | null | undefined) => {
  const normalized = text(value).replace(/\D/g, "").slice(0, 8);
  return normalized.length === 8 ? normalized : null;
};

const parseDate = (value: string | null | undefined) => {
  const normalized = toApiDateValue(value);
  if (!normalized) {
    return null;
  }
  const date = new Date(Number(normalized.slice(0, 4)), Number(normalized.slice(4, 6)) - 1, Number(normalized.slice(6, 8)));
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculatePeriod = (fromValue: string | null | undefined, toValue: string | null | undefined) => {
  const from = parseDate(fromValue);
  const to = parseDate(toValue);
  if (!from || !to || to < from) {
    return { dayCount: 0, monthCount: 0 };
  }

  const inclusiveTo = new Date(to);
  inclusiveTo.setDate(inclusiveTo.getDate() + 1);

  const dayCount = Math.max(0, Math.round((inclusiveTo.getTime() - from.getTime()) / 86400000));
  const monthCount = Math.round((dayCount / 30) * 100) / 100;
  return { dayCount, monthCount };
};

const formatMonthCount = (value: number | null | undefined) => Number(value ?? 0).toFixed(2);

const toRequest = (row: CompanyPerformanceContractPeriodRecord): CompanyPerformanceContractPeriodRequest => ({
  contractFromDate: toApiDateValue(row.contractFromDate),
  contractToDate: toApiDateValue(row.contractToDate),
  sortSeq: row.sortSeq,
});

function DateEditCell(params: GridRenderEditCellParams<CompanyPerformanceContractPeriodRecord, string | null>) {
  return (
    <TextField
      autoFocus
      fullWidth
      onChange={(event) => {
        void params.api.setEditCellValue({ id: params.id, field: params.field, value: toYmdText(event.target.value) }, event);
      }}
      placeholder="YYYYMMDD"
      size="small"
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8, pattern: "\\d{8}" } }}
      sx={standardFieldSx}
      value={toYmdText(params.value)}
    />
  );
}

export function CompanyPerformanceContractPeriodsGrid({ readOnly = false, record }: CompanyPerformanceContractPeriodsGridProps) {
  const queryClient = useQueryClient();
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const { confirmationDialog, requestConfirmation } = useEnterpriseRowActionConfirm();
  const [expanded, setExpanded] = useState(false);
  const [newRows, setNewRows] = useState<CompanyPerformanceContractPeriodRecord[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const initializedSeqRef = useRef<number | null>(null);

  const contractPeriodsQuery = useQuery({
    queryKey: ["company-performance-contract-periods", record.seq],
    queryFn: () => listCompanyPerformanceContractPeriods(record.seq),
    enabled: Boolean(record.seq),
  });

  useEffect(() => {
    if (!record.seq) {
      initializedSeqRef.current = null;
      const timeoutId = window.setTimeout(() => {
        setExpanded(false);
        setNewRows([]);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
    if (!contractPeriodsQuery.data || initializedSeqRef.current === record.seq) {
      return;
    }
    initializedSeqRef.current = record.seq;
    const timeoutId = window.setTimeout(() => {
      setExpanded(contractPeriodsQuery.data.length > 0);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [contractPeriodsQuery.data, record.seq]);

  const rows = useMemo(
    () => [...newRows, ...(contractPeriodsQuery.data ?? [])].sort((left, right) => (left.sortSeq ?? 0) - (right.sortSeq ?? 0) || left.id - right.id),
    [contractPeriodsQuery.data, newRows],
  );

  const invalidateContractPeriods = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["company-performance-contract-periods", record.seq] }),
    [queryClient, record.seq],
  );

  const saveMutation = useMutation({
    mutationFn: async (row: CompanyPerformanceContractPeriodRecord) => {
      if (!record.seq) {
        throw new Error("회사실적 저장 후 계약기간을 등록할 수 있습니다.");
      }
      if (row.isNew && !canCreate) {
        throw new Error("계약기간을 등록할 권한이 없습니다.");
      }
      if (!row.isNew && !canUpdate) {
        throw new Error("계약기간을 수정할 권한이 없습니다.");
      }
      const requestBody = toRequest(row);
      if (!requestBody.contractFromDate || !requestBody.contractToDate) {
        throw new Error("계약기간 from/to를 YYYYMMDD 형식으로 입력하세요.");
      }
      return row.isNew
        ? createCompanyPerformanceContractPeriod(record.seq, requestBody)
        : updateCompanyPerformanceContractPeriod(record.seq, row.id, requestBody);
    },
    onSuccess: (_saved, row) => {
      setNewRows((current) => current.filter((item) => item.id !== row.id));
      void invalidateContractPeriods();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      if (!record.seq) {
        throw new Error("회사실적 저장 후 계약기간을 삭제할 수 있습니다.");
      }
      if (!canDelete) {
        throw new Error("계약기간을 삭제할 권한이 없습니다.");
      }
      return deleteCompanyPerformanceContractPeriod(record.seq, id);
    },
    onSuccess: () => {
      void invalidateContractPeriods();
    },
  });

  const confirmProcessRowUpdate = useCallback(
    (row: CompanyPerformanceContractPeriodRecord): Omit<EnterpriseRowActionConfirm, "onConfirm"> => ({
      confirmColor: "primary",
      confirmLabel: row.isNew ? "등록" : "수정",
      message: row.isNew ? "계약기간을 등록하시겠습니까?" : "계약기간을 수정하시겠습니까?",
      targetLabel: `${toDateInputValue(row.contractFromDate)} ~ ${toDateInputValue(row.contractToDate)}`,
      title: row.isNew ? "계약기간 등록" : "계약기간 수정",
    }),
    [],
  );

  const confirmDeleteRow = useCallback(
    (row: CompanyPerformanceContractPeriodRecord) => {
      requestConfirmation({
        confirmColor: "error",
        confirmLabel: "삭제",
        message: "계약기간을 삭제하시겠습니까?",
        targetLabel: `${toDateInputValue(row.contractFromDate)} ~ ${toDateInputValue(row.contractToDate)}`,
        title: "계약기간 삭제",
        onConfirm: () => deleteMutation.mutateAsync(row.id),
      });
    },
    [deleteMutation, requestConfirmation],
  );

  const addRow = () => {
    const id = tempId();
    const newRow: CompanyPerformanceContractPeriodRecord = {
      contractFromDate: null,
      contractToDate: null,
      dayCount: 0,
      id,
      isNew: true,
      monthCount: 0,
      seq: record.seq,
      sortSeq: rows.length + 1,
    };
    setExpanded(true);
    setNewRows((current) => [newRow, ...current]);
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit, fieldToFocus: "contractFromDate" } }));
  };

  const handleRowEditStop: NonNullable<DataGridProps<CompanyPerformanceContractPeriodRecord>["onRowEditStop"]> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
      setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
      if (params.row.isNew) {
        setNewRows((current) => current.filter((row) => row.id !== params.id));
      }
      return;
    }

    if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setRowModesModel((current) => ({ ...current, [params.id]: { mode: GridRowModes.View, ignoreModifications: true } }));
      setNewRows((current) => current.filter((row) => row.id !== params.id));
    }
  };

  const columns = useMemo<GridColDef<CompanyPerformanceContractPeriodRecord>[]>(
    () => [
      {
        editable: true,
        field: "contractFromDate",
        flex: 1,
        headerName: "계약기간 from",
        minWidth: 140,
        renderCell: (params) => toDateInputValue(params.row.contractFromDate),
        renderEditCell: (params) => <DateEditCell {...params} />,
      },
      {
        editable: true,
        field: "contractToDate",
        flex: 1,
        headerName: "계약기간 to",
        minWidth: 140,
        renderCell: (params) => toDateInputValue(params.row.contractToDate),
        renderEditCell: (params) => <DateEditCell {...params} />,
      },
      {
        align: "right",
        field: "monthCount",
        headerAlign: "right",
        headerName: "개월",
        width: 86,
        valueFormatter: (value) => formatMonthCount(value as number | null),
        valueGetter: (_value, row) => calculatePeriod(row.contractFromDate, row.contractToDate).monthCount,
      },
      {
        align: "right",
        field: "dayCount",
        headerAlign: "right",
        headerName: "일",
        width: 86,
        valueGetter: (_value, row) => calculatePeriod(row.contractFromDate, row.contractToDate).dayCount,
      },
      {
        field: "actions",
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
        headerName: "관리",
        type: "actions",
        width: 96,
      },
    ],
    [canCreate, canDelete, canUpdate, confirmDeleteRow, deleteMutation.isPending, rowModesModel],
  );

  const gridColumns = useMemo(() => (readOnly ? columns.filter((column) => column.type !== "actions") : columns), [columns, readOnly]);

  const processRowUpdate = async (updatedRow: CompanyPerformanceContractPeriodRecord) => {
    if (readOnly) {
      return updatedRow;
    }
    const period = calculatePeriod(updatedRow.contractFromDate, updatedRow.contractToDate);
    const saved = await saveMutation.mutateAsync({ ...updatedRow, ...period });
    return saved;
  };

  return (
    <Box sx={{ border: "1px solid", borderColor: "#dbe3ee", borderRadius: 1, p: 0.75 }}>
      {confirmationDialog}
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, justifyContent: "flex-start" }}>
        <FormControlLabel
          control={<Switch checked={expanded} disabled={!record.seq} onChange={(_event, checked) => setExpanded(checked)} size="small" />}
          label="용역차수별 계약기간"
          sx={{ m: 0, "& .MuiFormControlLabel-label": { color: "text.secondary", fontSize: 13, fontWeight: 800 } }}
        />
        <Tooltip title="개월은 계약기간 from/to의 총 일수를 30일로 나눈 값입니다. 소수점 둘째 자리까지 표시하고 셋째 자리에서 반올림합니다.">
          <IconButton aria-label="개월 계산 방식" size="small" sx={{ color: "text.secondary", p: 0.25 }}>
            <HelpOutlineOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        {expanded && !readOnly ? (
          <Button
            disabled={!canCreate || !record.seq || saveMutation.isPending}
            onClick={addRow}
            size="small"
            startIcon={<AddOutlinedIcon />}
            sx={{ ml: "auto" }}
            variant="outlined"
          >
            추가
          </Button>
        ) : null}
      </Box>
      {expanded ? (
        record.seq ? (
          <EnterpriseDataGrid<CompanyPerformanceContractPeriodRecord>
            columns={gridColumns}
            confirmProcessRowUpdate={readOnly ? undefined : confirmProcessRowUpdate}
            editMode={readOnly ? undefined : "row"}
            getRowId={(row) => row.id}
            hideFooter
            hideFooterSelectedRowCount
            loading={contractPeriodsQuery.isLoading || contractPeriodsQuery.isFetching || saveMutation.isPending || deleteMutation.isPending}
            onProcessRowUpdateError={() => undefined}
            onRowEditStop={readOnly ? undefined : handleRowEditStop}
            onRowModesModelChange={readOnly ? undefined : setRowModesModel}
            processRowUpdate={readOnly ? undefined : processRowUpdate}
            readOnly={readOnly}
            rowHeight={30}
            rowModesModel={readOnly ? undefined : rowModesModel}
            rows={rows}
            showToolbar={false}
            wrapperMinHeight={210}
            sx={{
              border: 0,
              height: 210,
              minHeight: 210,
              mt: 0.75,
              "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
            }}
          />
        ) : (
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
            회사실적 저장 후 계약기간을 등록할 수 있습니다.
          </Typography>
        )
      ) : null}
    </Box>
  );
}
