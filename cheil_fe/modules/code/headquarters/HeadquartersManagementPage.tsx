"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { KakaoPostcodeFields } from "@/components/common/KakaoPostcodeFields";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { standardFieldSx } from "@/components/common/FormControls";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { toApiErrorMessage } from "@/lib/http/apiClient";

import {
  createCompanyAttachment,
  deleteCompanyAttachment,
  getCompanyProfile,
  updateCompanyProfile,
  uploadFile,
  type CompanyAttachmentRequest,
} from "./api";
import type {
  CompanyAttachment,
  CompanyAttachmentType,
  CompanyProfile,
} from "./companyProfile.types";

const attachmentTypeLabels: Record<CompanyAttachmentType, string> = {
  FINANCIAL: "재정상태 건실도",
  BUSINESS_REGISTRATION: "사업자 등록증",
  LICENSE: "업 면허증",
  ETC: "기타 증빙",
};

const emptyProfile: CompanyProfile = {
  address: "",
  addressDetail: "",
  businessItem: "",
  businessRegistrationNo: "",
  businessType: "",
  companyName: "",
  corporateRegistrationNo: "",
  establishedOn: "",
  faxNo: "",
  homepageUrl: "",
  mainBusiness: "",
  memo: "",
  phoneNo: "",
  postalCode: "",
  profileId: 1,
  representativeName: "",
};

const emptyAttachmentDraft = (): Omit<CompanyAttachmentRequest, "fileId" | "originalFilename" | "contentType" | "fileSize" | "downloadUrl"> => ({
  attachmentType: "FINANCIAL",
  fiscalYear: new Date().getFullYear(),
  issuedOn: "",
  note: "",
  title: "재정상태 건실도",
  validUntil: "",
});

const fieldSx = standardFieldSx;

const actionButtonSx = {
  minHeight: 34,
  minWidth: 88,
  px: 1.5,
  whiteSpace: "nowrap",
} as const;

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function HeadquartersManagementPage() {
  const { canCreate, canDelete, canRead, canUpdate } = useCurrentMenuPermission();
  const tabQueryEnabled = useTabQueryEnabled(canRead);
  const queryClient = useQueryClient();
  const companyQuery = useQuery({
    queryKey: ["system-company-profile"],
    queryFn: getCompanyProfile,
    enabled: tabQueryEnabled,
  });

  const detail = companyQuery.data;
  const [profileDraft, setProfileDraft] = useState<CompanyProfile>(emptyProfile);
  const [attachmentTab, setAttachmentTab] = useState<CompanyAttachmentType>("FINANCIAL");
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState(emptyAttachmentDraft);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState("");

  useEffect(() => {
    if (!detail?.profile) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setProfileDraft({ ...emptyProfile, ...detail.profile });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [detail?.profile]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["system-company-profile"] });

  const updateMutation = useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: () => {
      invalidate();
      setSnackbar("회사 기초정보를 저장했습니다.");
    },
    onError: (error) => setSnackbar(toApiErrorMessage(error, "회사 기초정보 저장에 실패했습니다.")),
  });

  const attachmentMutation = useMutation({
    mutationFn: async () => {
      if (!attachmentFile) {
        throw new Error("업로드할 파일을 선택하세요.");
      }
      const uploaded = await uploadFile(attachmentFile);
      return createCompanyAttachment({
        ...attachmentDraft,
        contentType: uploaded.contentType,
        downloadUrl: uploaded.downloadUrl,
        fileId: uploaded.fileId,
        fileSize: uploaded.size,
        originalFilename: uploaded.originalFilename,
      });
    },
    onSuccess: () => {
      invalidate();
      setAttachmentDialogOpen(false);
      setAttachmentDraft(emptyAttachmentDraft());
      setAttachmentFile(null);
      setSnackbar("첨부파일을 등록했습니다.");
    },
    onError: (error) => setSnackbar(toApiErrorMessage(error, "첨부파일 등록에 실패했습니다.")),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteCompanyAttachment,
    onSuccess: () => {
      invalidate();
      setSnackbar("첨부파일을 삭제했습니다.");
    },
    onError: (error) => setSnackbar(toApiErrorMessage(error, "첨부파일 삭제에 실패했습니다.")),
  });

  const attachments = useMemo(
    () => (detail?.attachments ?? []).filter((attachment) => attachment.attachmentType === attachmentTab),
    [attachmentTab, detail?.attachments],
  );

  const updateProfileField = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setProfileDraft((current) => ({ ...current, [key]: value }));
  };

  const attachmentColumns: GridColDef<CompanyAttachment>[] = [
    { field: "fiscalYear", headerName: "기준년도", width: 100, renderCell: (params) => params.value ?? "-" },
    { field: "originalFilename", headerName: "파일명", minWidth: 220, flex: 1 },

    { field: "issuedOn", headerName: "발급일", width: 120, renderCell: (params) => params.value ?? "-" },
    { field: "createdAt", headerName: "등록일", width: 150, renderCell: (params) => formatDateTime(params.value as string | null) },
    {
      field: "download",
      headerName: "다운로드",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="다운로드">
          <IconButton component="a" href={params.row.downloadUrl} size="small">
            <FileDownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "actions",
      headerName: "관리",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="삭제">
          <IconButton
            color="inherit"
            disabled={!canDelete || deleteAttachmentMutation.isPending}
            onClick={() => deleteAttachmentMutation.mutate(params.row.attachmentId)}
            size="small"
          >
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="본사정보 관리"
      />

      {!canRead ? (
        <Alert severity="warning">본사정보를 조회할 권한이 없습니다.</Alert>
      ) : (
        <>
          <Box sx={{ alignItems: "stretch", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "0.9fr 1.1fr" }, mb: 2 }}>
            <Card sx={{ minWidth: 0, height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography sx={{ borderLeft: "3px solid", borderColor: "primary.main", fontWeight: 800, pl: 1 }}>
                    기본정보
                  </Typography>
                  <Button
                    disabled={!canUpdate || updateMutation.isPending}
                    onClick={() => updateMutation.mutate(profileDraft)}
                    size="small"
                    startIcon={<SaveOutlinedIcon />}
                    sx={actionButtonSx}
                    variant="contained"
                  >
                    저장
                  </Button>
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                  <TextField disabled={!canUpdate} label="회사명" size="small" sx={fieldSx} value={profileDraft.companyName} onChange={(event) => updateProfileField("companyName", event.target.value)} />
                  <TextField disabled={!canUpdate} label="대표자명" size="small" sx={fieldSx} value={profileDraft.representativeName ?? ""} onChange={(event) => updateProfileField("representativeName", event.target.value)} />
                  <TextField disabled={!canUpdate} label="사업자등록번호" size="small" sx={fieldSx} value={profileDraft.businessRegistrationNo ?? ""} onChange={(event) => updateProfileField("businessRegistrationNo", event.target.value)} />
                  <TextField disabled={!canUpdate} label="법인등록번호" size="small" sx={fieldSx} value={profileDraft.corporateRegistrationNo ?? ""} onChange={(event) => updateProfileField("corporateRegistrationNo", event.target.value)} />
                  <TextField disabled={!canUpdate} label="설립일" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} value={profileDraft.establishedOn ?? ""} onChange={(event) => updateProfileField("establishedOn", event.target.value)} />
                  <TextField disabled={!canUpdate} label="전화번호" size="small" sx={fieldSx} value={profileDraft.phoneNo ?? ""} onChange={(event) => updateProfileField("phoneNo", event.target.value)} />
                  <TextField disabled={!canUpdate} label="팩스번호" size="small" sx={fieldSx} value={profileDraft.faxNo ?? ""} onChange={(event) => updateProfileField("faxNo", event.target.value)} />
                  <TextField disabled={!canUpdate} label="주요사업" size="small" sx={fieldSx} value={profileDraft.mainBusiness ?? ""} onChange={(event) => updateProfileField("mainBusiness", event.target.value)} />
                  <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                    <KakaoPostcodeFields
                      address={profileDraft.address ?? ""}
                      addressDetail={profileDraft.addressDetail ?? ""}
                      disabled={!canUpdate}
                      postalCode={profileDraft.postalCode ?? ""}
                      onChange={(value) =>
                        setProfileDraft((current) => ({
                          ...current,
                          address: value.address,
                          addressDetail: value.addressDetail,
                          postalCode: value.postalCode,
                        }))
                      }
                    />
                  </Box>
                  <TextField disabled={!canUpdate} label="비고" multiline minRows={3} sx={{ gridColumn: { md: "1 / -1" }, ...fieldSx }} value={profileDraft.memo ?? ""} onChange={(event) => updateProfileField("memo", event.target.value)} />
                </Box>
                {profileDraft.lastChangedAt ? (
                  <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
                    마지막 변경: {formatDateTime(profileDraft.lastChangedAt)} / {profileDraft.lastChangedId ?? "-"}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 0, height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ borderLeft: "3px solid", borderColor: "primary.main", fontWeight: 800, pl: 1 }}>
                    행정자료 첨부
                  </Typography>
                  <Button
                    disabled={!canCreate}
                    onClick={() => setAttachmentDialogOpen(true)}
                    size="small"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={actionButtonSx}
                    variant="outlined"
                  >
                    파일 등록
                  </Button>
                </Box>
                <Tabs value={attachmentTab} onChange={(_event, value) => setAttachmentTab(value)} sx={{ borderBottom: 1, borderColor: "divider", mb: 1.5 }}>
                  {Object.entries(attachmentTypeLabels).map(([value, label]) => (
                    <Tab key={value} label={label} value={value} />
                  ))}
                </Tabs>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <EnterpriseDataGrid
                    columns={attachmentColumns}
                    getRowId={(row) => row.attachmentId}
                    hideFooterSelectedRowCount
                    loading={companyQuery.isLoading}
                    rows={attachments}
                    showPageNumbers
                    sx={{ border: 0, minHeight: 300 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Dialog fullWidth maxWidth="sm" open={attachmentDialogOpen} onClose={() => setAttachmentDialogOpen(false)}>
            <DialogTitle>행정자료 파일 등록</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <TextField
                  disabled={!canCreate}
                  label="문서구분"
                  select
                  size="small"
                  value={attachmentDraft.attachmentType}
                  onChange={(event) => {
                    const nextType = event.target.value as CompanyAttachmentType;
                    setAttachmentDraft((current) => ({ ...current, attachmentType: nextType, title: attachmentTypeLabels[nextType] }));
                  }}
                >
                  {Object.entries(attachmentTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField disabled={!canCreate} label="문서명" size="small" value={attachmentDraft.title} onChange={(event) => setAttachmentDraft((current) => ({ ...current, title: event.target.value }))} />
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <TextField disabled={!canCreate} label="기준년도" size="small" type="number" value={attachmentDraft.fiscalYear ?? ""} onChange={(event) => setAttachmentDraft((current) => ({ ...current, fiscalYear: event.target.value ? Number(event.target.value) : null }))} />
                  <TextField disabled={!canCreate} label="발급일" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} value={attachmentDraft.issuedOn ?? ""} onChange={(event) => setAttachmentDraft((current) => ({ ...current, issuedOn: event.target.value }))} />
                  <TextField disabled={!canCreate} label="만료일" size="small" type="date" slotProps={{ inputLabel: { shrink: true } }} value={attachmentDraft.validUntil ?? ""} onChange={(event) => setAttachmentDraft((current) => ({ ...current, validUntil: event.target.value }))} />
                </Box>
                <Button component="label" disabled={!canCreate} startIcon={<UploadFileOutlinedIcon />} variant="outlined">
                  파일 선택
                  <input hidden type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} />
                </Button>
                <Typography color="text.secondary" variant="body2">
                  {attachmentFile ? attachmentFile.name : "선택된 파일이 없습니다."}
                </Typography>
                <Divider />
                <TextField disabled={!canCreate} label="비고" multiline minRows={2} value={attachmentDraft.note ?? ""} onChange={(event) => setAttachmentDraft((current) => ({ ...current, note: event.target.value }))} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button color="inherit" onClick={() => setAttachmentDialogOpen(false)}>
                취소
              </Button>
              <Button disabled={!canCreate || attachmentMutation.isPending || !attachmentFile} onClick={() => attachmentMutation.mutate()} variant="contained">
                등록
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Snackbar autoHideDuration={2500} message={snackbar} onClose={() => setSnackbar("")} open={Boolean(snackbar)} />
    </Box>
  );
}
