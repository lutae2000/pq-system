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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { DateTimeInput } from "@/components/common/DateTimeInput";
import { standardFieldSx } from "@/components/common/FormControls";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { NoticeLayerDialog } from "./NoticeLayerDialog";
import { createNotice, deleteNotice, listNoticesAdmin, updateNotice } from "./api";
import type { NoticeRecord } from "./notice.types";

type NoticeDraft = NoticeRecord;
const EMPTY_NOTICES: NoticeRecord[] = [];

const createEmptyNotice = (): NoticeDraft => ({
  id: `notice-tmp-${Date.now()}`,
  title: "",
  content: "",
  exposureStartAt: "",
  exposureEndAt: "",
  publishAt: "",
  important: false,
  active: true,
});

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
  const { canCreate, canDelete, canUpdate } = useCurrentMenuPermission();
  const { showSnackbar } = useAppSnackbar();
  const tabQueryEnabled = useTabQueryEnabled();
  const queryClient = useQueryClient();
  const noticesQuery = useQuery({
    queryKey: ["system-notices"],
    queryFn: listNoticesAdmin,
    enabled: tabQueryEnabled,
  });
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
  const canSaveCurrent = Boolean(draft) && (records.some((record) => record.id === draft?.id) ? canUpdate : canCreate);

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

  const persistSave = async (nextRecord: NoticeRecord) => {
    const exists = records.some((record) => record.id === nextRecord.id);
    const saved = exists ? await updateNotice(nextRecord.id, nextRecord) : await createNotice(nextRecord);

    queryClient.setQueryData<NoticeRecord[]>(["system-notices"], (current) => {
      const currentRecords = current ?? [];
      const recordExists = currentRecords.some((record) => record.id === saved.id);
      if (recordExists) {
        return currentRecords.map((record) => (record.id === saved.id ? saved : record));
      }
      return [saved, ...currentRecords];
    });

    setSelectedId(saved.id);
    setDraft(saved);
    setSaveTarget(null);
    showSnackbar({ message: "공지사항이 저장되었습니다.", severity: "success" });
    await queryClient.invalidateQueries({ queryKey: ["system-notices"] });
  };

  const handleSaveRequest = () => {
    const nextRecord = buildNextRecord();
    if (!nextRecord) {
      return;
    }

    if (records.some((record) => record.id === nextRecord.id)) {
      setSaveTarget(nextRecord);
      return;
    }

    void persistSave(nextRecord);
  };

  const confirmSave = () => {
    if (!saveTarget) {
      return;
    }

    void persistSave(saveTarget);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await deleteNotice(deleteTarget.id);

    queryClient.setQueryData<NoticeRecord[]>(["system-notices"], (current) => {
      const currentRecords = current ?? [];
      return currentRecords.filter((record) => record.id !== deleteTarget.id);
    });

    if (effectiveSelectedId === deleteTarget.id) {
      const nextSelected = records.find((record) => record.id !== deleteTarget.id)?.id ?? "";
      setSelectedId(nextSelected);
    }
    setDraft(null);
    setDeleteTarget(null);
    showSnackbar({ message: "공지사항이 삭제되었습니다.", severity: "success" });
    await queryClient.invalidateQueries({ queryKey: ["system-notices"] });
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
              <Typography color="text.secondary" variant="body2">
                노출 기간과 게시 시각을 관리하고, 팝업 미리보기로 바로 확인할 수 있습니다.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`활성 ${activeNotices.length}건`} size="small" variant="outlined" />
              <Button onClick={() => setPreviewOpen(true)} startIcon={<VisibilityOutlinedIcon />} variant="outlined">
                팝업 미리보기
              </Button>
              <Button disabled={!canCreate} onClick={handleNew} startIcon={<AddOutlinedIcon />} variant="contained">
                추가
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2 }}>
            <EnterpriseDataGrid<NoticeRecord>
              columns={noticeColumns}
              getRowId={(row) => row.id}
              hideFooterSelectedRowCount
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 100 } } }}
              loading={noticesQuery.isLoading || noticesQuery.isFetching}
              localeText={{ noRowsLabel: "조회된 공지사항이 없습니다." }}
              onRowClick={(params) => setSelectedId(params.id)}
              onRowDoubleClick={(params) => handleEdit(params.row)}
              pageSizeOptions={[100]}
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
          </Box>
        </CardContent>
      </Card>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setDraft(null)}
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
                  label="게시 시각"
                  onChange={(value) => setDraft((current) => (current ? { ...current, publishAt: value } : current))}
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
            onClick={() => setDeleteTarget(draft)}
            startIcon={<DeleteOutlineOutlinedIcon />}
            variant="outlined"
            sx={{ mr: "auto" }}
          >
            삭제
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button color="inherit" onClick={() => setDraft(null)} variant="outlined">
              닫기
            </Button>
            <Button disabled={!canSaveCurrent} onClick={handleSaveRequest} startIcon={<EditOutlinedIcon />} variant="contained">
              저장
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="xs" onClose={() => setSaveTarget(null)} open={Boolean(saveTarget)}>
        <DialogTitle>공지사항 수정 확인</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            아래 공지사항을 수정합니다.
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {saveTarget?.title ?? ""}
          </Typography>
          <Typography sx={{ mt: 1.25 }} color="text.secondary" variant="body2">
            수정 내용을 저장하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setSaveTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="primary" disabled={!canSaveCurrent} onClick={confirmSave} variant="contained">
            확인 후 저장
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <DialogTitle>공지사항 삭제 확인</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" variant="body2">
            아래 공지사항을 삭제합니다.
          </Typography>
          <Typography sx={{ mt: 0.75, fontWeight: 700 }} variant="body1">
            {deleteTarget?.title ?? ""}
          </Typography>
          <Typography sx={{ mt: 1.25 }} color="text.secondary" variant="body2">
            삭제 후에는 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)} variant="outlined">
            취소
          </Button>
          <Button color="error" disabled={!canDelete} onClick={confirmDelete} variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <NoticeLayerDialog notices={activeNotices} onClose={() => setPreviewOpen(false)} open={previewOpen} />

      <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
        선택 항목: {selectedRecord ? selectedRecord.title : "-"}
      </Typography>
    </Box>
  );
}
