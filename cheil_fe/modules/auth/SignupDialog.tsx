"use client";

import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";

import { CommonSelectField } from "@/components/common/CommonSelectField";
import { standardFieldSx } from "@/components/common/FormControls";
import { useSignupMutation } from "@/modules/auth/authMutations";
import { useDepartmentOptions, useRoleOptions } from "@/modules/common/reference/useReferenceOptions";

type SignupDialogProps = {
  onClose: () => void;
  onSuccess?: (loginId: string) => void;
  open: boolean;
};

const stripWhitespace = (value: string) => value.replace(/\s+/g, "");
const digitsOnly = (value: string) => value.replace(/\D+/g, "");

export function SignupDialog({ onClose, onSuccess, open }: SignupDialogProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [completionOpen, setCompletionOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signupMutation = useSignupMutation();
  const departmentOptions = useDepartmentOptions({ useYn: true });
  const roleOptions = useRoleOptions({ useYn: true });
  const [form, setForm] = useState({
    deptCode: "",
    employeeNo: "",
    groupCode: "",
    loginId: "",
    userName: "",
    userPassword: "",
  });

  const updateName = (rawValue: string) => {
    const value = stripWhitespace(rawValue).slice(0, 10);
    setForm((current) => ({ ...current, userName: value }));
  };

  const updateEmployeeNo = (rawValue: string) => {
    const value = digitsOnly(stripWhitespace(rawValue)).slice(0, 10);
    setForm((current) => ({ ...current, employeeNo: value }));
  };

  const updateLoginId = (rawValue: string) => {
    const value = stripWhitespace(rawValue).slice(0, 20);
    setForm((current) => ({ ...current, loginId: value }));
  };

  const resetForm = () => {
    setErrorMessage("");
    setShowPassword(false);
    setForm({
      deptCode: "",
      employeeNo: "",
      groupCode: "",
      loginId: "",
      userName: "",
      userPassword: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await signupMutation.mutateAsync({
        deptCode: form.deptCode,
        employeeNo: form.employeeNo,
        groupCode: form.groupCode,
        loginId: form.loginId,
        userPassword: form.userPassword,
        userName: form.userName,
      });
      setCompletionOpen(true);
      onSuccess?.(form.loginId);
      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "계정 생성에 실패했습니다.");
    }
  };

  return (
    <>
      <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography component="h3" sx={{ fontWeight: 900 }} variant="h6">
                계정 생성
              </Typography>
            </Box>
            <IconButton aria-label="close" onClick={handleClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: "grid", gap: 2 }}>
              {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

              <Box sx={{ display: "grid", gap: 1 }}>
                <Typography sx={{ color: "#0f172a", fontWeight: 900, letterSpacing: 0.2 }} variant="subtitle2">
                  기본 정보
                </Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField
                    autoComplete="name"
                    fullWidth
                    label="이름"
                    onChange={(event) => updateName(event.target.value)}
                    required
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 10 } }}
                    sx={standardFieldSx}
                    value={form.userName}
                  />
                  <TextField
                    autoComplete="off"
                    fullWidth
                    label="사번(선택)"
                    onChange={(event) => updateEmployeeNo(event.target.value)}
                    size="small"
                    slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 10, pattern: "\\d*" } }}
                    sx={standardFieldSx}
                    value={form.employeeNo}
                  />
                </Box>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <CommonSelectField
                    label="부서"
                    onChange={(value) => setForm((current) => ({ ...current, deptCode: value }))}
                    options={departmentOptions.options}
                    placeholder=""
                    required
                    size="small"
                    value={form.deptCode}
                  />
                  <CommonSelectField
                    label="역할"
                    onChange={(value) => setForm((current) => ({ ...current, groupCode: value }))}
                    options={roleOptions.options}
                    placeholder=""
                    required
                    size="small"
                    value={form.groupCode}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gap: 1 }}>
                <Typography sx={{ color: "#0f172a", fontWeight: 900, letterSpacing: 0.2 }} variant="subtitle2">
                  시스템 계정
                </Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  <TextField
                    autoComplete="username"
                    fullWidth
                    label="Login ID"
                    onChange={(event) => updateLoginId(event.target.value)}
                    required
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 20, spellCheck: false } }}
                    sx={standardFieldSx}
                    value={form.loginId}
                  />
                  <TextField
                    autoComplete="new-password"
                    fullWidth
                    label="Password"
                    onChange={(event) => setForm((current) => ({ ...current, userPassword: event.target.value }))}
                    required
                    size="small"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                              edge="end"
                              onClick={() => setShowPassword((current) => !current)}
                              size="small"
                            >
                              {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={standardFieldSx}
                    type={showPassword ? "text" : "password"}
                    value={form.userPassword}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button onClick={handleClose} sx={{ textTransform: "none" }} type="button" variant="text">
              취소
            </Button>
            <Button
              disabled={signupMutation.isPending}
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#12306b",
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#0f2554",
                },
              }}
            >
              {signupMutation.isPending ? "가입 중..." : "계정 생성"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog fullWidth maxWidth="xs" onClose={() => setCompletionOpen(false)} open={completionOpen}>
        <DialogTitle sx={{ pb: 1 }}>계정 생성 완료</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 700 }}>가입이 완료되었습니다. 안내에 따라 로그인해 주세요.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCompletionOpen(false)} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
