"use client";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import { changePassword } from "@/modules/auth/authApi";

type PasswordChangeDialogProps = {
  currentPassword: string;
  onClose: () => void;
  onCompleted: () => void;
  open: boolean;
};

export function PasswordChangeDialog({ currentPassword, onClose, onCompleted, open }: PasswordChangeDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  const handleChangePassword = async () => {
    setErrorMessage("");

    if (!newPassword.trim()) {
      setErrorMessage("새 비밀번호를 입력하세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsChanging(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setNewPassword("");
      setNewPasswordConfirm("");
      onCompleted();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>비밀번호 변경</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
        <Typography color="text.secondary" variant="body2">
          초기 비밀번호로 로그인했습니다. 계속 사용하려면 비밀번호를 변경하세요.
        </Typography>
        <TextField
          autoComplete="current-password"
          fullWidth
          label="현재 비밀번호"
          size="small"
          sx={standardFieldSx}
          type="password"
          value={currentPassword}
          slotProps={{ input: { readOnly: true } }}
        />
        <TextField
          autoComplete="new-password"
          autoFocus
          fullWidth
          label="새 비밀번호"
          onChange={(event) => setNewPassword(event.target.value.replace(/\s/g, ""))}
          size="small"
          sx={standardFieldSx}
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
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
        <TextField
          autoComplete="new-password"
          fullWidth
          label="새 비밀번호 확인"
          onChange={(event) => setNewPasswordConfirm(event.target.value.replace(/\s/g, ""))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleChangePassword();
            }
          }}
          size="small"
          sx={standardFieldSx}
          type={showNewPasswordConfirm ? "text" : "password"}
          value={newPasswordConfirm}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showNewPasswordConfirm ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 보기"} edge="end" onClick={() => setShowNewPasswordConfirm((current) => !current)} size="small">
                    {showNewPasswordConfirm ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={isChanging} onClick={handleChangePassword} variant="contained">
          변경
        </Button>
      </DialogActions>
    </Dialog>
  );
}
