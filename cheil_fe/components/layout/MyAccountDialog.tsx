"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { readAuthSession, writeAuthSession } from "@/lib/auth/authSession";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { getMyAccount, updateMyAccount, type MyAccountUpdateRequest } from "@/modules/auth/authApi";
import { useDepartmentOptions, useRoleOptions } from "@/modules/common/reference/useReferenceOptions";

type MyAccountDialogProps = {
  onClose: () => void;
  open: boolean;
};

type FormState = MyAccountUpdateRequest & {
  confirmPassword: string;
};

const emptyForm: FormState = {
  confirmPassword: "",
  deptCode: "",
  email: "",
  employeeNo: "",
  currentPassword: "",
  newPassword: "",
};

const accountSectionTitleSx = { fontWeight: 700, mb: 1.25 } as const;

const formatDate = (value: string | null | undefined) => {
  const text = value?.trim() ?? "";
  const match = text.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : text;
};

export function MyAccountDialog({ onClose, open }: MyAccountDialogProps) {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useAppSnackbar();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const departmentOptions = useDepartmentOptions({ useYn: true }, { enabled: open });
  const roleOptions = useRoleOptions({ useYn: true }, { enabled: open });

  const accountQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMyAccount,
    enabled: open,
  });

  useEffect(() => {
    if (!accountQuery.data) {
      return;
    }
    // The form is reset when the server response arrives after opening the dialog.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      ...emptyForm,
      deptCode: accountQuery.data.deptCode,
      email: accountQuery.data.email ?? "",
      employeeNo: accountQuery.data.employeeNo,
    });
  }, [accountQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (request: MyAccountUpdateRequest) => updateMyAccount(request),
    onSuccess: async (saved) => {
      const session = readAuthSession();
      if (session) {
        writeAuthSession({ ...session, deptCode: saved.deptCode, employeeNo: saved.employeeNo });
      }
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      showSuccess("내 계정 정보를 저장했습니다.");
      setConfirmOpen(false);
      onClose();
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : "내 계정 정보를 저장하지 못했습니다.");
      setConfirmOpen(false);
    },
  });

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.employeeNo.trim() || !form.deptCode) {
      showError("사번과 부서를 입력해 주세요.");
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      showError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setConfirmOpen(true);
  };

  const request: MyAccountUpdateRequest = {
    deptCode: form.deptCode,
    email: form.email.trim(),
    employeeNo: form.employeeNo.trim(),
    currentPassword: form.currentPassword?.trim() || undefined,
    newPassword: form.newPassword?.trim() || undefined,
  };
  const passwordConfirmed = Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword;

  return (
    <>
      <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
        <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          내 계정 정보
          <IconButton aria-label="닫기" onClick={onClose} size="small">
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {accountQuery.isError ? <Alert severity="error">내 계정 정보를 불러오지 못했습니다.</Alert> : null}
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
            <Typography sx={accountSectionTitleSx} variant="subtitle2">로그인 정보</Typography>
            <Alert severity="info" sx={{ mb: 1.5 }}>비밀번호를 변경하려면 현재 비밀번호와 새 비밀번호를 입력해 주세요.</Alert>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField disabled label="로그인 ID" value={accountQuery.data?.loginId ?? ""} />
              <TextField
                label="현재 비밀번호"
                onChange={(event) => updateForm("currentPassword", event.target.value)}
                type={showCurrentPassword ? "text" : "password"}
                value={form.currentPassword ?? ""}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label={showCurrentPassword ? "현재 비밀번호 숨기기" : "현재 비밀번호 보기"} edge="end" onClick={() => setShowCurrentPassword((current) => !current)} size="small">
                          {showCurrentPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="새 비밀번호"
                onChange={(event) => updateForm("newPassword", event.target.value)}
                type={showNewPassword ? "text" : "password"}
                value={form.newPassword ?? ""}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label={showNewPassword ? "새 비밀번호 숨기기" : "새 비밀번호 보기"} edge="end" onClick={() => setShowNewPassword((current) => !current)} size="small">
                          {showNewPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box>
                <TextField
                  label="새 비밀번호 확인"
                  onChange={(event) => updateForm("confirmPassword", event.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton aria-label={showConfirmPassword ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 보기"} edge="end" onClick={() => setShowConfirmPassword((current) => !current)} size="small">
                            {showConfirmPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {form.confirmPassword ? (
                  <Typography color={passwordConfirmed ? "success.main" : "error.main"} sx={{ mt: 0.5 }} variant="caption">
                    {passwordConfirmed ? "새 비밀번호가 일치합니다." : "새 비밀번호가 일치하지 않습니다."}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, mt: 1.5, p: 1.5 }}>
            <Typography sx={accountSectionTitleSx} variant="subtitle2">기본 계정 정보</Typography>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField disabled label="이름" value={accountQuery.data?.userName ?? ""} />
              <TextField label="사번" onChange={(event) => updateForm("employeeNo", event.target.value)} value={form.employeeNo} />
              <Autocomplete
                autoHighlight
                disabled={departmentOptions.isLoading}
                fullWidth
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, selected) => option.value === selected.value}
                loading={departmentOptions.isLoading}
                noOptionsText="부서가 없습니다."
                onChange={(_, nextValue) => updateForm("deptCode", nextValue?.value ?? "")}
                options={departmentOptions.options}
                value={departmentOptions.options.find((option) => option.value === form.deptCode) ?? null}
                renderInput={(params) => <TextField {...params} label="부서" placeholder="부서 검색" size="small" />}
              />
              <TextField label="이메일" onChange={(event) => updateForm("email", event.target.value)} type="email" value={form.email} />
              <TextField disabled label="역할" value={roleOptions.labelByValue[accountQuery.data?.groupCode ?? ""] ?? ""} />
              <TextField disabled label="패스워드 초기화 날짜" value={formatDate(accountQuery.data?.passwordResetDt)} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose} variant="outlined">취소</Button>
          <Button disabled={accountQuery.isLoading || updateMutation.isPending} onClick={handleSubmit} startIcon={<SaveOutlinedIcon />} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
      <ConfirmActionDialog
        confirmLabel="저장"
        loading={updateMutation.isPending}
        message="내 계정 정보를 저장하시겠습니까?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => updateMutation.mutate(request)}
        open={confirmOpen}
        title="내 계정 정보 저장 확인"
      />
    </>
  );
}
