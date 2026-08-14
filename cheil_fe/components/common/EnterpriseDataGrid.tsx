"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { Box, IconButton, MenuItem, Pagination, TextField, Tooltip } from "@mui/material";
import type { AllSystemCSSProperties, ResponsiveStyleValue } from "@mui/system";
import { usePathname } from "next/navigation";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridCellEditStopReasons,
  GridRowModes,
  GridRowEditStopReasons,
  gridPageCountSelector,
  gridPaginationModelSelector,
  useGridApiContext,
  useGridApiRef,
  useGridSelector,
  type GridColDef,
  type DataGridProps,
  type GridCellParams,
  type GridEventListener,
  type GridRowId,
  type GridInitialState,
  type GridToolbarProps,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import type { GridPrintExportOptions } from "@mui/x-data-grid/models";
import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { getPageLabel } from "@/shared/navigation/routeMeta";
import { useSessionMenuPermissions } from "@/shared/navigation/useSessionMenuPermissions";

type EnterpriseDataGridHeight = ResponsiveStyleValue<AllSystemCSSProperties["height"]>;

export type EnterpriseDataGridProps<Row extends GridValidRowModel> = DataGridProps<Row> & {
  exportFileNamePrefix?: string;
  enableCellSelection?: boolean;
  enableRowClickCheckboxSelection?: boolean;
  clipboardCopyCellDelimiter?: string;
  confirmProcessRowUpdate?: (
    updatedRow: Row,
    originalRow: Row,
  ) => Omit<EnterpriseRowActionConfirm, "onConfirm"> | null | undefined;
  isNewRow?: (row: Row) => boolean;
  onNewRowEditCancel?: (
    row: Row,
    params: Parameters<NonNullable<DataGridProps<Row>["onRowEditStop"]>>[0],
    event: Parameters<NonNullable<DataGridProps<Row>["onRowEditStop"]>>[1],
    details: Parameters<NonNullable<DataGridProps<Row>["onRowEditStop"]>>[2],
  ) => void;
  onExportPrint?: () => void;
  readOnly?: boolean;
  showPageInfo?: boolean;
  showPageNumbers?: boolean;
  showPrintButton?: boolean;
  showXlsxExportButton?: boolean;
  stateCacheKey?: string | false;
  wrapperMinHeight?: EnterpriseDataGridHeight;
};

export type EnterpriseRowActionConfirm = {
  confirmColor?: "primary" | "error" | "warning" | "success";
  confirmLabel?: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  targetLabel?: string;
  title: string;
};

type EnterpriseToolbarProps = GridToolbarProps & {
  onExportPrint?: () => void;
  onExportXlsx?: () => void;
  showPrintButton?: boolean;
  showXlsxExportButton?: boolean;
};

type CellCoordinate = {
  field: string;
  id: GridRowId;
};

type CellRange = {
  end: CellCoordinate;
  start: CellCoordinate;
};

type RowCheckboxSelectionIntent = {
  append: boolean;
  id: GridRowId;
  range: boolean;
};

type ClipboardPayload = {
  htmlText: string;
  plainText: string;
};

type XlsxExportColumn = {
  excludeFromXlsxExport?: boolean;
};

type PageSizeOption = number | { value: number; label: string };
type XlsxModule = typeof import("xlsx");

type EnterpriseFooterProps = {
  pageSizeOptions?: PageSizeOption[];
  showPageInfo?: boolean;
  showPageNumbers?: boolean;
};

type PendingRowUpdate<Row extends GridValidRowModel> = {
  action: Omit<EnterpriseRowActionConfirm, "onConfirm">;
  originalRow: Row;
  processUpdate: () => Promise<Row>;
  resolve: (row: Row) => void;
  reject: (error: unknown) => void;
};

function forceGridRowViewMode<Row extends GridValidRowModel>(
  apiRef: ReturnType<typeof useGridApiRef>,
  resolvedColumns: GridColDef<Row>[],
  rowId: GridRowId,
  ignoreModifications = false,
) {
  const gridApi = apiRef.current as
    | (typeof apiRef.current & {
        getCellMode?: (id: GridRowId, field: string) => string;
        getRowMode?: (id: GridRowId) => string;
        stopCellEditMode?: (params: { id: GridRowId; field: string; ignoreModifications?: boolean }) => void;
        stopRowEditMode?: (params: { id: GridRowId; ignoreModifications?: boolean }) => void;
      })
    | null;
  if (!gridApi) {
    return;
  }

  if (gridApi.getRowMode?.(rowId) === GridRowModes.Edit) {
    gridApi.stopRowEditMode?.({ id: rowId, ignoreModifications });
  }

  for (const column of resolvedColumns) {
    if (!column.editable || !column.field) {
      continue;
    }

    if (gridApi.getCellMode?.(rowId, column.field) !== "edit") {
      continue;
    }

    gridApi.stopCellEditMode?.({
      id: rowId,
      field: column.field,
      ignoreModifications,
    });
  }
}

const MAX_MIT_PAGE_SIZE = 100;
const enterpriseGridStateCache = new Map<string, GridInitialState>();
const gridEventPriorityOptions = { isFirst: true };
const GRID_CHECKBOX_SELECTION_FIELD = "__check__";

const clampPageSize = (pageSize: number | undefined, fallback = 10) => {
  const resolvedPageSize = Number.isFinite(pageSize) ? (pageSize as number) : fallback;
  return Math.min(Math.max(1, Math.trunc(resolvedPageSize)), MAX_MIT_PAGE_SIZE);
};

const getPageSizeOptionValue = (option: PageSizeOption) =>
  typeof option === "number" ? option : option.value;

const normalizePageSizeOption = (option: PageSizeOption) =>
  typeof option === "number" ? clampPageSize(option) : { ...option, value: clampPageSize(option.value) };

export function useEnterpriseRowActionConfirm() {
  const [pendingAction, setPendingAction] = useState<EnterpriseRowActionConfirm | null>(null);
  const [loading, setLoading] = useState(false);

  const requestConfirmation = useCallback((action: EnterpriseRowActionConfirm) => {
    setPendingAction(action);
  }, []);

  const closeConfirmation = useCallback(() => {
    if (!loading) {
      setPendingAction(null);
    }
  }, [loading]);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    setLoading(true);
    try {
      await pendingAction.onConfirm();
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }, [pendingAction]);

  const confirmationDialog = (
    <ConfirmActionDialog
      open={Boolean(pendingAction)}
      title={pendingAction?.title ?? ""}
      message={pendingAction?.message ?? ""}
      targetLabel={pendingAction?.targetLabel}
      confirmColor={pendingAction?.confirmColor ?? "primary"}
      confirmLabel={pendingAction?.confirmLabel ?? "확인"}
      enableKeyboardActions
      loading={loading}
      onClose={closeConfirmation}
      onConfirm={() => void confirmAction()}
    />
  );

  return {
    closeConfirmation,
    confirmationDialog,
    loading,
    pendingAction,
    requestConfirmation,
  };
}

const isPrintableGridColumn = (field: string, type?: string, disableExport?: boolean) =>
  !disableExport && type !== "actions" && !field.startsWith("__");

const exportCellValue = (value: unknown): string | number | boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return String(value);
};

const getConventionLabelValue = (row: GridValidRowModel, field: string) => {
  const candidates = [`${field}Label`, `${field}Name`];

  if (field.endsWith("Code")) {
    const baseField = field.slice(0, -"Code".length);
    candidates.push(`${baseField}Name`, `${baseField}Label`);
  }

  for (const candidate of candidates) {
    const value = row[candidate];
    if (value !== null && value !== undefined && String(value) !== "") {
      return value;
    }
  }

  return undefined;
};

const getDisplayCellValue = (
  apiRef: ReturnType<typeof useGridApiRef>,
  rowId: GridRowId,
  row: GridValidRowModel,
  column: GridColDef,
) => {
  const conventionLabel = getConventionLabelValue(row, column.field);
  if (conventionLabel !== undefined) {
    return conventionLabel;
  }

  const gridApi = apiRef.current;
  if (!gridApi) {
    return row[column.field];
  }

  const cellParams = gridApi.getCellParams(rowId, column.field);
  if (cellParams.formattedValue !== undefined && cellParams.formattedValue !== null) {
    return cellParams.formattedValue;
  }

  const formattedValue = gridApi.getRowFormattedValue(row, column);
  if (formattedValue !== undefined && formattedValue !== null) {
    return formattedValue;
  }

  return gridApi.getCellValue(rowId, column.field);
};

const cellKey = (id: GridRowId, field: string) => `${String(id)}\u0000${field}`;

const parseCellKey = (key: string) => {
  const separatorIndex = key.indexOf("\u0000");
  if (separatorIndex < 0) {
    return null;
  }

  return {
    field: key.slice(separatorIndex + 1),
    id: key.slice(0, separatorIndex),
  };
};

const hasNativeSelection = (element: EventTarget | null) => {
  if (window.getSelection()?.toString()) {
    return true;
  }

  if (element && element instanceof HTMLInputElement) {
    return (element.selectionEnd || 0) - (element.selectionStart || 0) > 0;
  }

  if (element && element instanceof HTMLTextAreaElement) {
    return (element.selectionEnd || 0) - (element.selectionStart || 0) > 0;
  }

  return false;
};

const isInteractiveTarget = (element: EventTarget | null) =>
  element instanceof HTMLElement &&
  Boolean(
    element.closest(
      'input, textarea, select, button, a, [role="button"], [role="combobox"], [contenteditable="true"], .MuiDataGrid-cell--editing',
    ),
  );

const normalizeClipboardCellText = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\r?\n/g, " ").replace(/\t/g, " ").trim();
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildClipboardPayload = (rows: string[][], delimiter: string): ClipboardPayload => {
  const plainText = rows.map((row) => row.join(delimiter)).join("\n");
  const htmlRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td style="border:1px solid #cbd5e1;padding:2px 6px;">${escapeHtml(cell).replace(/\n/g, "<br>")}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  return {
    htmlText: `<table style="border-collapse:collapse;"><tbody>${htmlRows}</tbody></table>`,
    plainText,
  };
};

const writeClipboardEventPayload = (event: ClipboardEvent<HTMLDivElement>, payload: ClipboardPayload) => {
  event.clipboardData.setData("text/plain", payload.plainText);
  event.clipboardData.setData("text/html", payload.htmlText);
  event.preventDefault();
  event.stopPropagation();
  (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
};

const copyToClipboard = (payload: ClipboardPayload) => {
  const fallbackCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = payload.plainText;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);

    textarea.focus({ preventScroll: true });
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  };

  if (!window.isSecureContext) {
    fallbackCopy();
    return;
  }

  if (navigator.clipboard && typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([payload.htmlText], { type: "text/html" }),
      "text/plain": new Blob([payload.plainText], { type: "text/plain" }),
    });

    navigator.clipboard.write([clipboardItem]).catch(fallbackCopy);
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(payload.plainText).catch(fallbackCopy);
    return;
  }

  fallbackCopy();
};

function EnterpriseToolbar({
  onExportPrint,
  onExportXlsx,
  showPrintButton = true,
  showXlsxExportButton = true,
  showQuickFilter,
  quickFilterProps,
}: EnterpriseToolbarProps) {
  return (
    <GridToolbarContainer sx={{ display: "flex", justifyContent: "space-between", gap: 1, px: 1, py: 0.75 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {showQuickFilter ? <GridToolbarQuickFilter {...quickFilterProps} /> : null}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
        {showXlsxExportButton && onExportXlsx ? (
          <Tooltip title="엑셀로 내보내기">
            <IconButton aria-label="엑셀로 내보내기" onClick={onExportXlsx} size="small">
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        {showPrintButton && onExportPrint ? (
          <Tooltip title="인쇄">
            <IconButton aria-label="인쇄" onClick={onExportPrint} size="small">
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </GridToolbarContainer>
  );
}

function EnterpriseFooter({ pageSizeOptions = [], showPageInfo = false, showPageNumbers = false }: EnterpriseFooterProps) {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = Math.max(1, useGridSelector(apiRef, gridPageCountSelector));
  const currentPage = paginationModel.page + 1;
  const pageSizeSelectOptions = pageSizeOptions.filter((option) => getPageSizeOptionValue(option) > 0);
  const showPageSizeSelect = showPageNumbers && pageSizeSelectOptions.length > 1;

  return (
    <GridFooterContainer
      sx={{
        alignItems: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        px: 2,
        py: 0.75,
      }}
    >
      {showPageInfo || showPageNumbers ? (
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
            {showPageInfo ? (
              <Box sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                {currentPage} / {Math.max(pageCount, 1)} 페이지
              </Box>
            ) : null}
            {showPageSizeSelect ? (
              <TextField
                label="행 수"
                onChange={(event) => {
                  const nextPageSize = clampPageSize(Number(event.target.value), paginationModel.pageSize);
                  apiRef.current.setPageSize(nextPageSize);
                  apiRef.current.setPage(0);
                }}
                select
                size="small"
                sx={{
                  minWidth: 92,
                  "& .MuiInputBase-root": { height: 32 },
                  "& .MuiInputLabel-root": { fontSize: 12 },
                  "& .MuiSelect-select": { fontSize: 13, py: 0.5 },
                }}
                value={paginationModel.pageSize}
              >
                {pageSizeSelectOptions.map((option) => {
                  const value = getPageSizeOptionValue(option);
                  return (
                    <MenuItem key={value} value={value}>
                      {typeof option === "number" ? value : option.label}
                    </MenuItem>
                  );
                })}
              </TextField>
            ) : null}
          </Box>
          {showPageNumbers ? (
            <Pagination
              color="primary"
              count={pageCount}
              onChange={(_, page) => apiRef.current.setPage(page - 1)}
              page={currentPage}
              size="small"
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={1}
            />
          ) : null}
        </Box>
      ) : null}
      {showPageNumbers ? null : <GridPagination />}
    </GridFooterContainer>
  );
}

function buildSelectedCellClipboardPayload(
  apiRef: ReturnType<typeof useGridApiRef>,
  selectedCellKeys: Set<string>,
  delimiter: string,
): ClipboardPayload | null {
  const gridApi = apiRef.current;
  if (!gridApi || selectedCellKeys.size === 0) {
    return null;
  }

  const visibleColumns = gridApi
    .getVisibleColumns()
    .filter((column) => isPrintableGridColumn(column.field, column.type, column.disableExport))
    .filter((column) => !(column as GridColDef & XlsxExportColumn).excludeFromXlsxExport);
  const rowIds = gridApi.getSortedRowIds();
  const rowIndexById = new Map(rowIds.map((rowId, index) => [String(rowId), index]));
  const columnIndexByField = new Map(visibleColumns.map((column, index) => [column.field, index]));

  let minRowIndex = Number.POSITIVE_INFINITY;
  let maxRowIndex = Number.NEGATIVE_INFINITY;
  let minColumnIndex = Number.POSITIVE_INFINITY;
  let maxColumnIndex = Number.NEGATIVE_INFINITY;

  for (const key of selectedCellKeys) {
    const parsedKey = parseCellKey(key);
    if (!parsedKey) {
      continue;
    }

    const rowIndex = rowIndexById.get(parsedKey.id);
    const columnIndex = columnIndexByField.get(parsedKey.field);
    if (rowIndex === undefined || columnIndex === undefined) {
      continue;
    }

    minRowIndex = Math.min(minRowIndex, rowIndex);
    maxRowIndex = Math.max(maxRowIndex, rowIndex);
    minColumnIndex = Math.min(minColumnIndex, columnIndex);
    maxColumnIndex = Math.max(maxColumnIndex, columnIndex);
  }

  if (
    !Number.isFinite(minRowIndex) ||
    !Number.isFinite(maxRowIndex) ||
    !Number.isFinite(minColumnIndex) ||
    !Number.isFinite(maxColumnIndex)
  ) {
    return null;
  }

  const rows: string[][] = [];
  for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex += 1) {
    const rowId = rowIds[rowIndex];
    const row = gridApi.getRow(rowId);
    if (!row) {
      continue;
    }

    const cells: string[] = [];
    for (let columnIndex = minColumnIndex; columnIndex <= maxColumnIndex; columnIndex += 1) {
      const column = visibleColumns[columnIndex];
      if (!column) {
        cells.push("");
        continue;
      }

      if (!selectedCellKeys.has(cellKey(rowId, column.field))) {
        cells.push("");
        continue;
      }

      const value = getDisplayCellValue(apiRef, rowId, row, column);
      cells.push(normalizeClipboardCellText(value));
    }
    rows.push(cells);
  }

  if (!rows.length) {
    return null;
  }

  return buildClipboardPayload(rows, delimiter);
}

function buildCellKeySet(apiRef: ReturnType<typeof useGridApiRef>, range: CellRange) {
  const gridApi = apiRef.current;
  if (!gridApi) {
    return new Set<string>();
  }

  const visibleColumns = gridApi
    .getVisibleColumns()
    .filter((column) => isPrintableGridColumn(column.field, column.type, column.disableExport))
    .filter((column) => !(column as GridColDef & XlsxExportColumn).excludeFromXlsxExport);
  const rowIds = gridApi.getSortedRowIds();
  const startRowIndex = rowIds.findIndex((id) => String(id) === String(range.start.id));
  const endRowIndex = rowIds.findIndex((id) => String(id) === String(range.end.id));
  const startColumnIndex = visibleColumns.findIndex((column) => column.field === range.start.field);
  const endColumnIndex = visibleColumns.findIndex((column) => column.field === range.end.field);

  if (startRowIndex < 0 || endRowIndex < 0 || startColumnIndex < 0 || endColumnIndex < 0) {
    return new Set<string>();
  }

  const keys = new Set<string>();
  const minRowIndex = Math.min(startRowIndex, endRowIndex);
  const maxRowIndex = Math.max(startRowIndex, endRowIndex);
  const minColumnIndex = Math.min(startColumnIndex, endColumnIndex);
  const maxColumnIndex = Math.max(startColumnIndex, endColumnIndex);

  for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex += 1) {
    for (let columnIndex = minColumnIndex; columnIndex <= maxColumnIndex; columnIndex += 1) {
      keys.add(cellKey(rowIds[rowIndex], visibleColumns[columnIndex].field));
    }
  }

  return keys;
}

function buildXlsxWorkbook(apiRef: ReturnType<typeof useGridApiRef>, xlsx: XlsxModule) {
  const gridApi = apiRef.current;
  if (!gridApi) {
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([[""]]), "Sheet1");
    return workbook;
  }

  const visibleColumns = gridApi
    .getVisibleColumns()
    .filter((column) => isPrintableGridColumn(column.field, column.type, column.disableExport));
  const rowIds = gridApi.getSortedRowIds();
  const rows: Array<Array<string | number | boolean | null>> = [];

  rows.push(visibleColumns.map((column) => column.headerName?.trim() || column.field));

  rowIds.forEach((rowId) => {
    const row = gridApi.getRow(rowId);
    if (!row) {
      return;
    }

    rows.push(
      visibleColumns.map((column) => {
        const value = getDisplayCellValue(apiRef, rowId, row, column);

        return exportCellValue(value);
      }),
    );
  });

  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return workbook;
}

export function EnterpriseDataGrid<Row extends GridValidRowModel>(props: EnterpriseDataGridProps<Row>) {
  const {
    clipboardCopyCellDelimiter,
    confirmProcessRowUpdate,
    exportFileNamePrefix,
    onExportPrint,
    getCellClassName: userGetCellClassName,
    getRowClassName: userGetRowClassName,
    enableCellSelection,
    initialState,
    columns,
    editMode: userEditMode,
    isCellEditable: userIsCellEditable,
    paginationModel: userPaginationModel,
    paginationMode: userPaginationMode,
    processRowUpdate: userProcessRowUpdate,
    rowCount: userRowCount,
    rowModesModel: userRowModesModel,
    onRowModesModelChange: userOnRowModesModelChange,
    onRowEditStop: userOnRowEditStop,
    onNewRowEditCancel,
    isNewRow,
    onRowClick: userOnRowClick,
    cellModesModel: userCellModesModel,
    onCellModesModelChange: userOnCellModesModelChange,
    onCellEditStop: userOnCellEditStop,
    checkboxSelection: userCheckboxSelection,
    enableRowClickCheckboxSelection = true,
    rowSelection: userRowSelection,
    apiRef: userApiRef,
    slots: userSlots,
    slotProps: userSlotProps,
    pageSizeOptions,
    readOnly = false,
    showPageInfo = false,
    showPageNumbers = true,
    showToolbar,
    showPrintButton = false,
    showXlsxExportButton = false,
    stateCacheKey,
    wrapperMinHeight = 440,
    sx: userSx,
    ...restProps
  } = props;
  const pathname = usePathname();
  const permissions = useSessionMenuPermissions();
  const internalApiRef = useGridApiRef();
  const apiRef = userApiRef ?? internalApiRef;
  const cellSelectionEnabled = enableCellSelection ?? true;
  const previousRowModesModelRef = useRef(userRowModesModel);
  const rowClickCheckboxSelectionEnabled =
    enableRowClickCheckboxSelection && Boolean(userCheckboxSelection) && userRowSelection !== false;
  const dragStartRef = useRef<CellCoordinate | null>(null);
  const selectionAnchorRef = useRef<CellCoordinate | null>(null);
  const selectionLeadRef = useRef<CellCoordinate | null>(null);
  const rowSelectionAnchorRef = useRef<GridRowId | null>(null);
  const rowCheckboxSelectionIntentRef = useRef<RowCheckboxSelectionIntent | null>(null);
  const applyRowSelectionRef = useRef<(rowId: GridRowId, selected: boolean, append: boolean, range: boolean) => void>(() => undefined);
  const isDraggingRef = useRef(false);
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(() => new Set());
  const [pendingRowUpdate, setPendingRowUpdate] = useState<PendingRowUpdate<Row> | null>(null);
  const [rowUpdateConfirmLoading, setRowUpdateConfirmLoading] = useState(false);

  const getRowClassName = (params: Parameters<NonNullable<DataGridProps<Row>["getRowClassName"]>>[0]) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? "enterprise-row-even" : "enterprise-row-odd"];

    if (userGetRowClassName) {
      const userClassName = userGetRowClassName(params);
      if (userClassName) {
        classes.push(userClassName);
      }
    }

    return classes.join(" ");
  };

  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const resolvedMenuName = (exportFileNamePrefix?.trim() || getPageLabel(pathname, permissions) || "export").trim();
  const sanitizedMenuName = resolvedMenuName.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ");
  const exportFileName = `${sanitizedMenuName}_${dateStamp}`;
  const userPrintOptions =
    userSlotProps?.toolbar && "printOptions" in userSlotProps.toolbar ? userSlotProps.toolbar.printOptions : undefined;

  const printOptions: GridPrintExportOptions = {
    ...(userPrintOptions ?? {}),
    fileName: exportFileName,
    hideFooter: true,
    hideToolbar: true,
    includeCheckboxes: true,
    pageStyle: ".MuiDataGrid-root .MuiDataGrid-main { color: rgba(0, 0, 0, 0.87); }",
  };
  const resolvedRowHeight = restProps.rowHeight ?? 35;
  const resolvedRowCount = userPaginationMode === "server" ? userRowCount ?? 0 : undefined;
  const gridStateCacheId = useMemo(() => {
    if (stateCacheKey === false) {
      return null;
    }

    const columnSignature = columns.map((column) => column.field).join("|");
    return stateCacheKey ?? `${pathname}::${exportFileNamePrefix ?? columnSignature}`;
  }, [columns, exportFileNamePrefix, pathname, stateCacheKey]);

  const ignoreValueFormatterDuringExport = cellSelectionEnabled
    ? { csvExport: true, clipboardExport: true }
    : restProps.ignoreValueFormatterDuringExport;
  const resolvedColumns = useMemo(
    () => (readOnly ? columns.map((column) => ({ ...column, editable: false })) : columns),
    [columns, readOnly],
  );
  const resolvedPageSizeOptions = useMemo(() => {
    const options = pageSizeOptions ?? [10, 20, 40];
    const normalizedOptions = options.map(normalizePageSizeOption);
    const seenValues = new Set<number>();

    return normalizedOptions.filter((option) => {
      const value = getPageSizeOptionValue(option);
      if (seenValues.has(value)) {
        return false;
      }

      seenValues.add(value);
      return true;
    });
  }, [pageSizeOptions]);
  const resolvedShowPageInfo = showPageNumbers ? false : showPageInfo;
  const resolvedPaginationModel = useMemo(() => {
    if (!userPaginationModel) {
      return undefined;
    }

    return {
      ...userPaginationModel,
      pageSize: clampPageSize(userPaginationModel.pageSize),
    };
  }, [userPaginationModel]);
  const resolvedInitialState = useMemo(() => {
    const cachedInitialState = gridStateCacheId ? enterpriseGridStateCache.get(gridStateCacheId) : undefined;
    const sourceInitialState = cachedInitialState ?? initialState;
    const paginationModel = sourceInitialState?.pagination?.paginationModel;

    return {
      ...sourceInitialState,
      pagination: {
        ...sourceInitialState?.pagination,
        paginationModel: {
          ...paginationModel,
          page: paginationModel?.page ?? 0,
          pageSize: clampPageSize(paginationModel?.pageSize),
        },
      },
    };
  }, [gridStateCacheId, initialState]);

  const processRowUpdate = useCallback<NonNullable<DataGridProps<Row>["processRowUpdate"]>>(
    (updatedRow, originalRow, params) => {
      if (readOnly || !userProcessRowUpdate) {
        return updatedRow;
      }

      const confirmation = confirmProcessRowUpdate?.(updatedRow, originalRow);
      if (!confirmation) {
        return userProcessRowUpdate(updatedRow, originalRow, params);
      }

      return new Promise<Row>((resolve, reject) => {
        setPendingRowUpdate({
          action: confirmation,
          originalRow,
          processUpdate: async () => userProcessRowUpdate(updatedRow, originalRow, params) as Promise<Row>,
          reject,
          resolve,
        });
      });
    },
    [confirmProcessRowUpdate, readOnly, userProcessRowUpdate],
  );

  const isNewEditableRow = useCallback(
    (row: Row) => (isNewRow ? isNewRow(row) : Boolean((row as { isNew?: unknown }).isNew)),
    [isNewRow],
  );

  const handleRowModesModelChange = useCallback<NonNullable<DataGridProps<Row>["onRowModesModelChange"]>>(
    (nextRowModesModel, details) => {
      const previousRowModesModel = userRowModesModel ?? {};

      for (const [rowId, rowMode] of Object.entries(nextRowModesModel)) {
        const previousMode = previousRowModesModel[rowId]?.mode;
        if (rowMode?.mode === GridRowModes.View && previousMode === GridRowModes.Edit) {
          forceGridRowViewMode(apiRef, resolvedColumns, rowId, Boolean(rowMode.ignoreModifications));
        }
      }

      userOnRowModesModelChange?.(nextRowModesModel, details);
    },
    [apiRef, resolvedColumns, userOnRowModesModelChange, userRowModesModel],
  );

  const handleRowEditStop = useCallback<NonNullable<DataGridProps<Row>["onRowEditStop"]>>(
    (params, event, details) => {
      if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
        event.stopPropagation();
        (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      }

      if (params.reason === GridRowEditStopReasons.rowFocusOut && userRowModesModel && userOnRowModesModelChange) {
        const nextRowModesModel = {
          ...userRowModesModel,
          [params.id]: {
            ...(userRowModesModel[params.id] ?? {}),
            mode: GridRowModes.View,
          },
        };
        forceGridRowViewMode(apiRef, resolvedColumns, params.id);
        userOnRowModesModelChange(nextRowModesModel, details);
      }

      userOnRowEditStop?.(params, event, details);

      if (params.reason !== GridRowEditStopReasons.escapeKeyDown || !isNewEditableRow(params.row)) {
        return;
      }

      onNewRowEditCancel?.(params.row, params, event, details);
    },
    [apiRef, isNewEditableRow, onNewRowEditCancel, resolvedColumns, userOnRowEditStop, userOnRowModesModelChange, userRowModesModel],
  );

  const handleCellEditStop = useCallback<NonNullable<DataGridProps<Row>["onCellEditStop"]>>(
    (params, event, details) => {
      if (params.reason === GridCellEditStopReasons.escapeKeyDown) {
        event.stopPropagation();
        (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      }

      userOnCellEditStop?.(params, event, details);
    },
    [userOnCellEditStop],
  );

  useEffect(() => {
    const previousRowModesModel = previousRowModesModelRef.current ?? {};
    const currentRowModesModel = userRowModesModel ?? {};

    for (const [rowId, rowMode] of Object.entries(currentRowModesModel)) {
      const previousMode = previousRowModesModel[rowId]?.mode;
      if (rowMode?.mode === GridRowModes.View && previousMode === GridRowModes.Edit) {
        forceGridRowViewMode(apiRef, resolvedColumns, rowId, Boolean(rowMode.ignoreModifications));
      }
    }

    previousRowModesModelRef.current = userRowModesModel;
  }, [apiRef, resolvedColumns, userRowModesModel]);

  const closeRowUpdateConfirm = useCallback(() => {
    if (rowUpdateConfirmLoading) {
      return;
    }

    setPendingRowUpdate((current) => {
      current?.resolve(current.originalRow);
      return null;
    });
  }, [rowUpdateConfirmLoading]);

  const confirmRowUpdate = useCallback(async () => {
    if (!pendingRowUpdate) {
      return;
    }

    setRowUpdateConfirmLoading(true);
    try {
      const savedRow = await pendingRowUpdate.processUpdate();
      pendingRowUpdate.resolve(savedRow);
      setPendingRowUpdate(null);
    } catch (error) {
      pendingRowUpdate.reject(error);
      setPendingRowUpdate(null);
    } finally {
      setRowUpdateConfirmLoading(false);
    }
  }, [pendingRowUpdate]);

  const selectSingleCell = useCallback(
    (cell: CellCoordinate, append: boolean) => {
      setSelectedCellKeys((current) => {
        const next = append ? new Set(current) : new Set<string>();
        next.add(cellKey(cell.id, cell.field));
        return next;
      });

      if (!append || !selectionAnchorRef.current) {
        selectionAnchorRef.current = cell;
      }
      selectionLeadRef.current = cell;
    },
    [],
  );

  const selectCellRange = useCallback(
    (start: CellCoordinate, end: CellCoordinate, append: boolean) => {
      const range = { end, start };
      const nextRangeKeys = buildCellKeySet(apiRef, range);

      setSelectedCellKeys((current) => {
        if (!append) {
          return nextRangeKeys;
        }

        const next = new Set(current);
        nextRangeKeys.forEach((key) => next.add(key));
        return next;
      });

      if (!append || !selectionAnchorRef.current) {
        selectionAnchorRef.current = start;
      }
      selectionLeadRef.current = end;
    },
    [apiRef],
  );

  const copySelectedCells = useCallback(() => {
    const payload = buildSelectedCellClipboardPayload(apiRef, selectedCellKeys, clipboardCopyCellDelimiter ?? "\t");
    if (!payload) {
      return false;
    }

    copyToClipboard(payload);
    apiRef.current?.publishEvent("clipboardCopy", payload.plainText);
    return true;
  }, [apiRef, clipboardCopyCellDelimiter, selectedCellKeys]);

  const getVisibleRowRangeIds = (startId: GridRowId, endId: GridRowId) => {
    const gridApi = apiRef.current;
    if (!gridApi) {
      return [endId];
    }

    const startIndex = gridApi.getRowIndexRelativeToVisibleRows(startId);
    const endIndex = gridApi.getRowIndexRelativeToVisibleRows(endId);

    if (startIndex < 0 || endIndex < 0) {
      return [endId];
    }

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    const rowIds: GridRowId[] = [];

    for (let rowIndex = minIndex; rowIndex <= maxIndex; rowIndex += 1) {
      const rowId = gridApi.getRowIdFromRowIndex(rowIndex);
      if (gridApi.isRowSelectable(rowId)) {
        rowIds.push(rowId);
      }
    }

    return rowIds;
  };

  const applyRowSelection = (rowId: GridRowId, selected: boolean, append: boolean, range: boolean) => {
    const gridApi = apiRef.current;
    if (!gridApi || !gridApi.isRowSelectable(rowId)) {
      return;
    }

    if (range) {
      const rangeStartId = rowSelectionAnchorRef.current ?? rowId;
      const rangeIds = getVisibleRowRangeIds(rangeStartId, rowId);

      if (append) {
        const nextIds = new Set(gridApi.getSelectedRows().keys());
        rangeIds.forEach((nextRowId) => {
          if (selected) {
            nextIds.add(nextRowId);
          } else {
            nextIds.delete(nextRowId);
          }
        });
        gridApi.setRowSelectionModel({ type: "include", ids: nextIds });
      } else {
        gridApi.setRowSelectionModel({ type: "include", ids: selected ? new Set(rangeIds) : new Set<GridRowId>() });
      }
    } else {
      if (append) {
        const nextIds = new Set(gridApi.getSelectedRows().keys());
        if (selected) {
          nextIds.add(rowId);
        } else {
          nextIds.delete(rowId);
        }
        gridApi.setRowSelectionModel({ type: "include", ids: nextIds });
      } else {
        gridApi.setRowSelectionModel({ type: "include", ids: selected ? new Set([rowId]) : new Set<GridRowId>() });
      }
    }

    rowSelectionAnchorRef.current = rowId;
  };

  useEffect(() => {
    applyRowSelectionRef.current = applyRowSelection;
  });

  const exportAsXlsx = async () => {
    const xlsx = await import("xlsx");
    const workbook = buildXlsxWorkbook(apiRef, xlsx);
    const fileData = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([fileData], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${exportFileName}.xlsx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  };

  const FooterSlot = useCallback(
    () => <EnterpriseFooter pageSizeOptions={resolvedPageSizeOptions} showPageInfo={resolvedShowPageInfo} showPageNumbers={showPageNumbers} />,
    [resolvedPageSizeOptions, resolvedShowPageInfo, showPageNumbers],
  );

  const getCellClassName = useCallback(
    (params: Parameters<NonNullable<DataGridProps<Row>["getCellClassName"]>>[0]) => {
      const classes: string[] = [];
      const userClassName = userGetCellClassName?.(params);

      if (userClassName) {
        classes.push(userClassName);
      }

      if (cellSelectionEnabled && selectedCellKeys.has(cellKey(params.id, params.field))) {
        classes.push("enterprise-cell-selected");
      }

      return classes.join(" ");
    },
    [cellSelectionEnabled, selectedCellKeys, userGetCellClassName],
  );

  useEffect(() => {
    if (!cellSelectionEnabled) {
      return undefined;
    }

    const gridApi = apiRef.current;
    if (!gridApi) {
      return undefined;
    }

    const isSelectableCell = (params: GridCellParams) => {
      const column = gridApi.getColumn(params.field);
      return isPrintableGridColumn(params.field, column.type, column.disableExport);
    };

    const startSelection = (params: GridCellParams, event: MouseEvent<HTMLElement>) => {
      if (event.button !== 0 || isInteractiveTarget(event.target) || !isSelectableCell(params)) {
        return;
      }

      const cell = { id: params.id, field: params.field };
      const isAppendSelection = event.ctrlKey || event.metaKey;
      const shouldExtendRange = event.shiftKey;

      if (shouldExtendRange) {
        const rangeStart = selectionLeadRef.current ?? selectionAnchorRef.current ?? cell;
        selectCellRange(rangeStart, cell, isAppendSelection);
        dragStartRef.current = null;
        isDraggingRef.current = false;
        event.preventDefault();
        return;
      }

      if (isAppendSelection) {
        selectSingleCell(cell, true);
        dragStartRef.current = null;
        isDraggingRef.current = false;
        event.preventDefault();
        return;
      }

      dragStartRef.current = cell;
      isDraggingRef.current = true;
      selectSingleCell(cell, false);
      event.preventDefault();
    };

    const updateSelection = (params: GridCellParams, event: MouseEvent<HTMLElement>) => {
      if (!isDraggingRef.current || !dragStartRef.current || !isSelectableCell(params)) {
        return;
      }

      selectCellRange(dragStartRef.current, { id: params.id, field: params.field }, false);
      event.preventDefault();
    };

    const endSelection = (params: GridCellParams, event: MouseEvent<HTMLElement>) => {
      updateSelection(params, event);
      isDraggingRef.current = false;
    };

    const unsubscribeMouseDown = gridApi.subscribeEvent("cellMouseDown", startSelection);
    const unsubscribeMouseOver = gridApi.subscribeEvent("cellMouseOver", updateSelection);
    const unsubscribeMouseUp = gridApi.subscribeEvent("cellMouseUp", endSelection);
    const stopDragging = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mouseup", stopDragging);

    return () => {
      unsubscribeMouseDown();
      unsubscribeMouseOver();
      unsubscribeMouseUp();
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [apiRef, cellSelectionEnabled, selectCellRange, selectSingleCell]);

  useEffect(() => {
    const gridApi = apiRef.current;
    if (!gridApi) {
      return undefined;
    }

    const captureCheckboxSelectionIntent: GridEventListener<"cellMouseDown"> = (params, event) => {
      if (params.field !== GRID_CHECKBOX_SELECTION_FIELD || event.button !== 0) {
        return;
      }

      rowCheckboxSelectionIntentRef.current = {
        append: event.ctrlKey || event.metaKey,
        id: params.id,
        range: event.shiftKey,
      };
    };

    const handleCheckboxSelection: GridEventListener<"rowSelectionCheckboxChange"> = (params, event) => {
      const capturedIntent =
        rowCheckboxSelectionIntentRef.current && String(rowCheckboxSelectionIntentRef.current.id) === String(params.id)
          ? rowCheckboxSelectionIntentRef.current
          : null;
      const nativeEvent = event.nativeEvent as Event & {
        ctrlKey?: boolean;
        metaKey?: boolean;
        shiftKey?: boolean;
        stopImmediatePropagation?: () => void;
      };
      const isAppendSelection = capturedIntent?.append ?? Boolean(nativeEvent.ctrlKey || nativeEvent.metaKey);
      const shouldExtendRange = capturedIntent?.range ?? Boolean(nativeEvent.shiftKey);
      rowCheckboxSelectionIntentRef.current = null;

      if (!isAppendSelection && !shouldExtendRange) {
        rowSelectionAnchorRef.current = params.id;
        return;
      }

      event.defaultMuiPrevented = true;
      event.preventDefault();
      event.stopPropagation();
      nativeEvent.stopImmediatePropagation?.();

      applyRowSelectionRef.current(params.id, params.value, isAppendSelection, shouldExtendRange);
    };

    const unsubscribeMouseDown = gridApi.subscribeEvent("cellMouseDown", captureCheckboxSelectionIntent, gridEventPriorityOptions);
    const unsubscribeCheckboxChange = gridApi.subscribeEvent("rowSelectionCheckboxChange", handleCheckboxSelection, gridEventPriorityOptions);

    return () => {
      unsubscribeMouseDown();
      unsubscribeCheckboxChange();
    };
  }, [apiRef]);

  useEffect(() => {
    if (!gridStateCacheId) {
      return undefined;
    }

    const saveCurrentGridState = () => {
      const gridApi = apiRef.current;
      if (!gridApi) {
        return;
      }

      enterpriseGridStateCache.set(gridStateCacheId, gridApi.exportState());
    };
    const saveOnPageHide = () => saveCurrentGridState();
    const saveOnVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentGridState();
      }
    };

    window.addEventListener("pagehide", saveOnPageHide);
    document.addEventListener("visibilitychange", saveOnVisibilityChange);

    return () => {
      saveCurrentGridState();
      window.removeEventListener("pagehide", saveOnPageHide);
      document.removeEventListener("visibilitychange", saveOnVisibilityChange);
    };
  }, [apiRef, gridStateCacheId]);

  const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    userSlotProps?.root?.onKeyDownCapture?.(event);

    if (!cellSelectionEnabled) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "c" && hasNativeSelection(event.target)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "c") {
      const copied = copySelectedCells();
      if (copied) {
        event.preventDefault();
        event.stopPropagation();
        (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('button[aria-label="삭제"]')
      ) {
        event.preventDefault();
        event.stopPropagation();
        (event.nativeEvent as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      }
    }
  };

  const handleCopyCapture = (event: ClipboardEvent<HTMLDivElement>) => {
    userSlotProps?.root?.onCopyCapture?.(event);

    if (event.defaultPrevented || !cellSelectionEnabled || hasNativeSelection(event.target)) {
      return;
    }

    const payload = buildSelectedCellClipboardPayload(apiRef, selectedCellKeys, clipboardCopyCellDelimiter ?? "\t");
    if (!payload) {
      return;
    }

    writeClipboardEventPayload(event, payload);
    apiRef.current?.publishEvent("clipboardCopy", payload.plainText);
  };

  const handleRowClick: NonNullable<DataGridProps<Row>["onRowClick"]> = (params, event, details) => {
    userOnRowClick?.(params, event, details);

    if (event.defaultMuiPrevented || !rowClickCheckboxSelectionEnabled || isInteractiveTarget(event.target)) {
      return;
    }

    const clickedField = event.target instanceof HTMLElement
      ? event.target.closest(".MuiDataGrid-cell")?.getAttribute("data-field")
      : null;
    if (clickedField === GRID_CHECKBOX_SELECTION_FIELD) {
      return;
    }

    const gridApi = apiRef.current;
    if (!gridApi) {
      return;
    }

    const selected = !gridApi.isRowSelected(params.id);
    applyRowSelection(params.id, selected, event.ctrlKey || event.metaKey, event.shiftKey);
  };

  return (
    <Box sx={{ display: "flex", height: wrapperMinHeight, minHeight: wrapperMinHeight, minWidth: 0, width: "100%" }}>
      <ConfirmActionDialog
        open={Boolean(pendingRowUpdate)}
        title={pendingRowUpdate?.action.title ?? ""}
        message={pendingRowUpdate?.action.message ?? ""}
        targetLabel={pendingRowUpdate?.action.targetLabel}
        confirmColor={pendingRowUpdate?.action.confirmColor ?? "primary"}
        confirmLabel={pendingRowUpdate?.action.confirmLabel ?? "확인"}
        enableKeyboardActions
        loading={rowUpdateConfirmLoading}
        onClose={closeRowUpdateConfirm}
        onConfirm={() => void confirmRowUpdate()}
      />
      <DataGrid
        apiRef={apiRef}
        {...restProps}
        clipboardCopyCellDelimiter={clipboardCopyCellDelimiter ?? "\t"}
        cellModesModel={readOnly ? undefined : userCellModesModel}
        checkboxSelection={userCheckboxSelection}
        columns={resolvedColumns}
        editMode={readOnly ? undefined : userEditMode}
        getCellClassName={getCellClassName}
        ignoreValueFormatterDuringExport={ignoreValueFormatterDuringExport}
        isCellEditable={readOnly ? () => false : userIsCellEditable}
        showToolbar={showToolbar ?? true}
        disableRowSelectionOnClick
        showCellVerticalBorder
        showColumnVerticalBorder
        paginationMode={userPaginationMode}
        pageSizeOptions={resolvedPageSizeOptions}
        paginationModel={resolvedPaginationModel}
        rowCount={resolvedRowCount}
        getRowSpacing={() => ({ top: 0, bottom: 1 })}
        getRowClassName={getRowClassName}
        onCellEditStop={readOnly ? undefined : handleCellEditStop}
        onCellModesModelChange={readOnly ? undefined : userOnCellModesModelChange}
        onRowClick={handleRowClick}
        onRowEditStop={readOnly ? undefined : handleRowEditStop}
        onRowModesModelChange={readOnly ? undefined : handleRowModesModelChange}
        processRowUpdate={readOnly ? undefined : processRowUpdate}
        rowSelection={userRowSelection}
        rowHeight={resolvedRowHeight}
        rowModesModel={readOnly ? undefined : userRowModesModel}
        rowSpacingType="border"
        initialState={resolvedInitialState}
        slots={{
          ...userSlots,
          footer: FooterSlot,
          toolbar: EnterpriseToolbar,
        }}
        slotProps={{
          ...userSlotProps,
          root: {
            ...userSlotProps?.root,
            onCopyCapture: handleCopyCapture,
            onKeyDownCapture: handleKeyDownCapture,
          },
          toolbar: {
            ...userSlotProps?.toolbar,
            showQuickFilter: userSlotProps?.toolbar?.showQuickFilter ?? false,
            quickFilterProps: userSlotProps?.toolbar?.quickFilterProps,
            showPrintButton,
            showXlsxExportButton,
            onExportPrint: onExportPrint ?? (() => apiRef.current?.exportDataAsPrint(printOptions)),
            onExportXlsx: exportAsXlsx,
          } as EnterpriseToolbarProps,
        }}
        sx={{
          flex: 1,
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          border: "1px solid",
          borderColor: "#d6e0eb",
          borderRadius: 2,
          bgcolor: "#ffffff",
          overflow: "hidden",
          "& .MuiDataGrid-columnHeaderTitle": {
            color: "#0f172a",
            fontWeight: 800,
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#eff6ff",
            borderBottom: "1px solid",
            borderColor: "#cbd5e1",
          },
          "& .MuiDataGrid-columnSeparator": {
            color: "#d7e3ef",
          },
          "& .MuiDataGrid-cell": {
            alignContent: "center",
            borderColor: "#e2e8f0",
            color: "#334155",
          },
          "& .MuiDataGrid-row": {
            color: "#334155",
          },
          "& .MuiDataGrid-row.enterprise-row-even": {
            backgroundColor: "#f8fafc",
          },
          "& .MuiDataGrid-row.enterprise-row-odd": {
            backgroundColor: "#ffffff",
          },
          "& .MuiDataGrid-row.enterprise-row-even:hover": {
            backgroundColor: "#eef4fb",
          },
          "& .MuiDataGrid-row.enterprise-row-odd:hover": {
            backgroundColor: "#f3f7fb",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "#dbeafe !important",
          },
          "& .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: "#c7e0ff !important",
          },
          "& .MuiDataGrid-cell.enterprise-cell-selected": {
            backgroundColor: "#bfdbfe",
            outline: "1px solid #60a5fa",
            outlineOffset: -1,
          },
          "& .MuiDataGrid-row:hover .MuiDataGrid-cell.enterprise-cell-selected": {
            backgroundColor: "#bfdbfe",
          },
          ...userSx,
        }}
      />
    </Box>
  );
}
