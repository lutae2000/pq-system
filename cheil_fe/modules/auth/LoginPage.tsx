"use client";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { standardFieldSx } from "@/components/common/FormControls";
import { consumeAuthNotice, writeAuthSession } from "@/lib/auth/authSession";
import { SignupDialog } from "@/modules/auth/SignupDialog";
import { useLoginMutation } from "@/modules/auth/authMutations";
import { listMyMenuPermissions } from "@/modules/auth/authApi";
import { PasswordChangeDialog } from "@/modules/auth/PasswordChangeDialog";
import { useBrandingSettings } from "@/modules/system/branding/useBrandingSettings";
import { useLayoutStore } from "@/store/layoutStore";

const removeWhitespace = (value: string) => value.replace(/\s/g, "");

export function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const loginMutation = useLoginMutation();
  const { settings: brandingSettings } = useBrandingSettings();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const notice = consumeAuthNotice();
      if (notice) {
        setErrorMessage(notice);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      const response = await loginMutation.mutateAsync({
        loginId,
        userPassword,
      });

      const baseSession = {
        accessToken: response.token.accessToken,
        accessTokenExpiresAt: response.token.expiresAt ?? response.session.expiresAt ?? null,
        employeeNo: response.employeeNo,
        issuedAt: new Date().toISOString(),
        loginId: response.loginId,
        deptCode: response.deptCode,
        idleTimeoutMinutes: response.session.idleTimeoutMinutes ?? null,
        sessionExpiresAt: response.session.expiresAt ?? null,
        sessionTimeoutMinutes: response.session.timeoutMinutes ?? null,
        userName: response.userName,
      };

      writeAuthSession(baseSession);
      useLayoutStore.getState().resetTabs();
      const permissions = await listMyMenuPermissions();
      writeAuthSession({ ...baseSession, permissions });

      if (response.passwordReset) {
        setCurrentPassword(userPassword);
        setIsPasswordChangeOpen(true);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        aria-hidden
        component="img"
        alt=""
        src={brandingSettings.loginBackgroundUrl}
        sx={{
          inset: 0,
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          position: "absolute",
          width: "100%",
          zIndex: 0,
          filter: "saturate(1.04) contrast(1.03)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          background:
            "linear-gradient(90deg, rgba(248, 250, 252, 0.14) 0%, rgba(248, 250, 252, 0.08) 42%, rgba(248, 250, 252, 0.04) 100%)",
          inset: 0,
          position: "absolute",
          zIndex: 1,
        }}
      />

      <Box
        sx={{
          left: { xs: 16, md: 28 },
          position: "absolute",
          top: { xs: 16, md: 24 },
          zIndex: 2,
        }}
      >
        <Box
          component="img"
          alt="Cheil"
          src="/branding/logo_white_landscape.png"
          sx={{
            display: "block",
            height: { xs: 30, md: 38 },
            objectFit: "contain",
            width: { xs: 132, md: 166 },
          }}
        />
      </Box>

      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
          px: 2,
          py: 4,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Paper
          component="form"
          elevation={0}
          onSubmit={handleSubmit}
          sx={{
            border: "1px solid",
            borderColor: "#e2e8f0",
            borderRadius: 2,
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 440,
            bgcolor: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: "#eff6ff",
                color: "#2563eb",
                height: 54,
                width: 54,
              }}
            >
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900, mt: 2 }}>
              로그인(테스트)
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              autoComplete="username"
              autoFocus
              fullWidth
              label="Login ID"
              onChange={(event) => setLoginId(removeWhitespace(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                }
              }}
              placeholder="아이디"
              required
              size="small"
              type="text"
              value={loginId}
              sx={standardFieldSx}
            />
            <TextField
              autoComplete="current-password"
              fullWidth
              label="Password"
              onChange={(event) => setUserPassword(removeWhitespace(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                }
              }}
              required
              size="small"
              type={showPassword ? "text" : "password"}
              value={userPassword}
              sx={standardFieldSx}
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
            />

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Button
              fullWidth
              disabled={loginMutation.isPending}
              size="large"
              startIcon={<LoginOutlinedIcon />}
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#1e293b",
                fontWeight: 800,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#0f172a",
                },
              }}
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>

            <Button
              fullWidth
              onClick={() => setIsSignupOpen(true)}
              type="button"
              sx={{ fontWeight: 700, textTransform: "none" }}
              variant="text"
            >
              계정 생성
            </Button>
          </Box>
        </Paper>
      </Box>

      <SignupDialog
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={(signedUpLoginId) => {
          setLoginId(signedUpLoginId);
          setUserPassword("");
        }}
      />

      <PasswordChangeDialog
        currentPassword={currentPassword}
        onClose={() => setIsPasswordChangeOpen(false)}
        onCompleted={() => {
          setIsPasswordChangeOpen(false);
          setUserPassword("");
          router.replace("/dashboard");
        }}
        open={isPasswordChangeOpen}
      />
    </Box>
  );
}
