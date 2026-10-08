"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { DateTimeInput } from "@/components/common/DateTimeInput";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { NoticeLayerDialog } from "./NoticeLayerDialog";
import { useNoticeMutations } from "./application/useNoticeMutations";
import { useNoticeQueries } from "./application/useNoticeQueries";
import type { NoticeRecord } from "./notice.types";

type NoticeDraft = NoticeRecord;
const EMPTY_NOTICES: NoticeRecord[] = [];

const createEmptyNotice = (): NoticeDraft => ({
  id: `notice-tmp-${Date.now()}`,
  title: "",
  content: "",
  exposureStartAt: "",
  exposureEndAt: "",
  publishAt: currentDateTimeValue(),
  important: false,
  active: true,
});

const currentDateTimeValue = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 16);

const noticeColumns: GridColDef<NoticeRecord>[] = [
  {
    field: "important",
    headerName: "중요",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => <Chip color={params.value ? "warning" : "default"} label={params.value ? "중요" : "일반"} size="small" variant="outlined" />,
  },
  {
    field: "active",
    headerName: "사용",
    width: 90,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => <Chip color={params.value ? "success" : "default"} label={params.value ? "Y" : "N"} size="small" />,
  },
  { field: "title", headerName: "공지 제목", flex: 1.2, minWidth: 260 },
  { field: "publishAt", headerName: "게시 시각", width: 170, renderCell: (params) => formatDateTime(String(params.value ?? "")) },
  { field: "exposureStartAt", headerName: "노출 시작", width: 170, renderCell: (params) => formatDateTime(String(params.value ?? "")) },
  { field: "exposureEndAt", headerName: "노출 종료", width: 170, renderCell: (params) => formatDateTime(String(params.value ?? "")) },
];

export function NotificationManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const { showSnackbar } = useAppSnackbar();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const { noticesQuery } = useNoticeQueries({ enabled: tabQueryEnabled });
  const [selectedId, setSelectedId] = useState<GridRowId>("");
  const [draft, setDraft] = useState<NoticeDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoticeDraft | null>(null);
  const [saveTarget, setSaveTarget] = useState<NoticeDraft | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const records = useMemo(() => noticesQuery.data ?? EMPTY_NOTICES, [noticesQuery.data]);
  const effectiveSelectedId = selectedId || records[0]?.id || "";
  const selectedRecord = useMemo(() => records.find((record) => record.id === effectiveSelectedId) ?? null, [effectiveSelectedId, records]);
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ ids: new Set<GridRowId>(effectiveSelectedId ? [effectiveSelectedId] : []), type: "include" }),
    [effectiveSelectedId],
  );
  const activeNotices = useMemo(() => records.filter((record) => record.active), [records]);
  const isExistingDraft = Boolean(draft && records.some((record) => record.id === draft.id));
  const canSaveCurrent = Boolean(draft) && (isExistingDraft ? canUpdate : canCreate);

  const handleMutationError = (error: unknown, fallbackMessage: string) => {
    showSnackbar({ message: error instanceof Error ? error.message : fallbackMessage, severity: "error" });
  };

  const { deleteMutation, saveMutation } = useNoticeMutations({
    canCreate,
    canDelete,
    canUpdate,
    onDeleted: (deletedId) => {
      if (effectiveSelectedId === deletedId) {
        setSelectedId(records.find((record) => record.id !== deletedId)?.id ?? "");
      }
      setDraft(null);
      setDeleteTarget(null);
      showSnackbar({ message: "공지사항이 삭제되었습니다.", severity: "success" });
    },
    onError: handleMutationError,
    onSaved: (saved, created) => {
      setSelectedId(saved.id);
      setDraft(null);
      setSaveTarget(null);
      showSnackbar({ message: created ? "공지사항이 등록되었습니다." : "공지사항이 저장되었습니다.", severity: "success" });
    },
  });

  const handleNew = () => {
    const nextDraft = createEmptyNotice();
    setDraft(nextDraft);
    setSelectedId(nextDraft.id);
  };

  const handleEdit = (record: NoticeRecord) => {
    setDraft({ ...record });
    setSelectedId(record.id);
  };

  const buildNextRecord = (): NoticeRecord | null => {
    if (!draft?.title.trim() || !draft.content.trim() || !draft.publishAt || !draft.exposureStartAt || !draft.exposureEndAt) {
      showSnackbar({ message: "제목, 내용, 게시 시각, 노출 시작/종료 시각을 모두 입력해 주세요.", severity: "error" });
      return null;
    }

    if (new Date(draft.exposureStartAt).getTime() >= new Date(draft.exposureEndAt).getTime()) {
      showSnackbar({ message: "노출 종료 시각은 시작 시각보다 늦어야 합니다.", severity: "error" });
      return null;
    }

    return {
      ...draft,
      id: draft.id,
      title: draft.title.trim(),
      content: draft.content.trim(),
      publishAt: draft.publishAt.trim(),
      exposureStartAt: draft.exposureStartAt.trim(),
      exposureEndAt: draft.exposureEndAt.trim(),
    };
  };

  const handleSaveRequest = () => {
    const nextRecord = buildNextRecord();
    if (!nextRecord) {
      return;
    }

    setSaveTarget(nextRecord);
  };

  const confirmSave = () => {
    if (!saveTarget) {
      return;
    }

    saveMutation.mutate({ existing: records.some((record) => record.id === saveTarget.id), record: saveTarget });
  };

  const requestDelete = () => {
    if (draft) {
      setDeleteTarget(draft);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <Box>
      <PageHeader title="공지사항 관리" />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                공지사항 목록
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`활성 ${activeNotices.length}건`} size="small" variant="outlined" />
              <Button disabled={!canRead} onClick={() => setPreviewOpen(true)} startIcon={<VisibilityOutlinedIcon />} variant="outlined">
                팝업 미리보기
              </Button>
              <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="contained">
                추가
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2 }}>
            {canRead ? (
              <EnterpriseDataGrid<NoticeRecord>
                columns={noticeColumns}
                getRowId={(row) => row.id}
                hideFooterSelectedRowCount
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
                loading={noticesQuery.isLoading || noticesQuery.isFetching}
                localeText={{ noRowsLabel: "조회된 공지사항이 없습니다." }}
                onRowClick={(params) => setSelectedId(params.id)}
                onRowDoubleClick={(params) => handleEdit(params.row)}
                pageSizeOptions={[10, 50, 100]}
                rowSelectionModel={rowSelectionModel}
                rows={records}
                showPageNumbers
                showToolbar={false}
                wrapperMinHeight={480}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(15, 23, 42, 0.02)" },
                  "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                }}
              />
            ) : (
              <Alert severity="warning">공지사항 조회 권한이 없습니다.</Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={saveMutation.isPending || deleteMutation.isPending ? undefined : () => setDraft(null)}
        open={Boolean(draft)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CampaignOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                공지사항 편집
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          {draft ? (
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="공지 제목"
                  size="small"
                  sx={standardFieldSx}
                  value={draft.title}
                  onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimeInput
                  disabled
                  label="게시 시각"
                  value={draft.publishAt}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="중요 공지"
                  size="small"
                  value={draft.important ? "Y" : "N"}
                  onChange={(event) => setDraft((current) => (current ? { ...current, important: event.target.value === "Y" } : current))}
                >
                  <MenuItem value="Y">Y</MenuItem>
                  <MenuItem value="N">N</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimeInput
                  label="노출 시작 시각"
                  onChange={(value) => setDraft((current) => (current ? { ...current, exposureStartAt: value } : current))}
                  value={draft.exposureStartAt}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimeInput
                  label="노출 종료 시각"
                  onChange={(value) => setDraft((current) => (current ? { ...current, exposureEndAt: value } : current))}
                  value={draft.exposureEndAt}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  label="공지 내용"
                  size="small"
                  value={draft.content}
                  onChange={(event) => setDraft((current) => (current ? { ...current, content: event.target.value } : current))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography color="text.secondary" variant="body2">
                      사용 여부
                    </Typography>
                    <Switch checked={draft.active} onChange={(event) => setDraft((current) => (current ? { ...current, active: event.target.checked } : current))} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2, justifyContent: "space-between" }}>
          <Button
            color="error"
            disabled={!canDelete}
            onClick={requestDelete}
            startIcon={<DeleteOutlineOutlinedIcon />}
            variant="outlined"
            sx={{ mr: "auto" }}
          >
            삭제
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" disabled={saveMutation.isPending || deleteMutation.isPending} onClick={() => setDraft(null)} variant="outlined">
              닫기
            </Button>
            <Button disabled={!canSaveCurrent || saveMutation.isPending} onClick={handleSaveRequest} startIcon={<EditOutlinedIcon />} variant="contained">
              저장
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        loading={saveMutation.isPending}
        message={isExistingDraft ? "수정 내용을 저장하시겠습니까?" : "새 공지사항을 등록하시겠습니까?"}
        onClose={() => setSaveTarget(null)}
        onConfirm={confirmSave}
        open={Boolean(saveTarget)}
        targetLabel={saveTarget?.title}
        title={isExistingDraft ? "공지사항 수정 확인" : "공지사항 등록 확인"}
      />

      <ConfirmDeleteDialog
        loading={deleteMutation.isPending}
        message="삭제 후에는 복구할 수 없습니다. 계속하시겠습니까?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleteTarget)}
        targetLabel={deleteTarget?.title}
      />

      <NoticeLayerDialog notices={activeNotices} onClose={() => setPreviewOpen(false)} open={previewOpen} />
    </Box>
  );
}
