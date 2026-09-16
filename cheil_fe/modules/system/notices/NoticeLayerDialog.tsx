"use client";

import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, Stack, Typography } from "@mui/material";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import { useState } from "react";
import type { NoticeRecord } from "./notice.types";

type NoticeLayerDialogProps = {
  isLoading?: boolean;
  notices: NoticeRecord[];
  onClose: () => void;
  onNoticeClick?: (notice: NoticeRecord) => void;
  onMuteMenu?: (targetPath: string) => void;
  onDismissToday?: () => void;
  open: boolean;
  showTodayHideOption?: boolean;
  title?: string;
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 16);

export function NoticeLayerDialog({
  isLoading = false,
  notices,
  onClose,
  onNoticeClick,
  onMuteMenu,
  onDismissToday,
  open,
  showTodayHideOption = false,
  title = "시스템 공지사항",
}: NoticeLayerDialogProps) {
  const [hideToday, setHideToday] = useState(false);

  const visibleNotices = [...notices]
    .filter((notice) => notice.active)
    .sort((left, right) => Number(right.important) - Number(left.important) || right.publishAt.localeCompare(left.publishAt));

  const handleClose = () => {
    if (hideToday && onDismissToday) {
      onDismissToday();
    }
    setHideToday(false);
    onClose();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={handleClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          background: "linear-gradient(135deg, #173b6c 0%, #2563a8 100%)",
          color: "primary.contrastText",
          display: "flex",
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
          <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex", height: 40, justifyContent: "center", width: 40 }}>
            <CampaignRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 800, lineHeight: 1.2 }} variant="h6">{title}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>서비스 운영과 관련된 주요 안내를 확인하세요.</Typography>
          </Box>
          {visibleNotices.length > 0 ? <Chip label={`${visibleNotices.length}건`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.17)", color: "inherit", fontWeight: 700 }} /> : null}
        </Box>
        <IconButton aria-label="공지사항 닫기" onClick={handleClose} size="small" sx={{ color: "inherit" }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ bgcolor: "#f6f8fc", p: 2.25 }}>
        <Stack spacing={1.5}>
          {isLoading ? (
            <Box
              sx={{
                alignItems: "center",
                borderRadius: 2,
                bgcolor: "background.paper",
                color: "text.secondary",
                display: "flex",
                justifyContent: "center",
                minHeight: 160,
                px: 2,
                textAlign: "center",
              }}
            >
              공지사항을 불러오는 중입니다.
            </Box>
          ) : visibleNotices.length > 0 ? (
            visibleNotices.map((notice) => (
              <Box
                key={notice.id}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: notice.important ? "warning.light" : "divider",
                  borderRadius: 2,
                  boxShadow: notice.important ? "0 8px 24px rgba(237, 108, 2, 0.10)" : "0 4px 14px rgba(15, 23, 42, 0.05)",
                  overflow: "hidden",
                  p: 0,
                }}
              >
                <Box sx={{ bgcolor: notice.important ? "warning.main" : "primary.main", height: 4 }} />
                <Stack spacing={1.25} sx={{ p: 2 }}>
                  <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                      <Box sx={{ alignItems: "center", bgcolor: notice.important ? "rgba(237, 108, 2, 0.10)" : "rgba(25, 118, 210, 0.08)", borderRadius: 1.5, color: notice.important ? "warning.main" : "primary.main", display: "flex", flex: "0 0 auto", height: 34, justifyContent: "center", width: 34 }}>
                        {notice.important ? <PriorityHighRoundedIcon fontSize="small" /> : <CampaignRoundedIcon fontSize="small" />}
                      </Box>
                      <Typography sx={{ fontSize: 16, fontWeight: 800 }} variant="subtitle1">
                        {notice.title}
                      </Typography>
                      {notice.important ? <Chip color="warning" label="중요 공지" size="small" /> : null}
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {notice.targetPath && onMuteMenu ? <IconButton aria-label="이 메뉴 알림 끄기" onClick={() => onMuteMenu(notice.targetPath!)} size="small"><NotificationsOffOutlinedIcon fontSize="small" /></IconButton> : null}
                      {notice.targetPath && onNoticeClick ? <IconButton aria-label="알림 확인" onClick={() => onNoticeClick(notice)} size="small"><LaunchOutlinedIcon fontSize="small" /></IconButton> : null}
                    </Stack>
                  </Box>

                  <Typography color="text.secondary" variant="body2" sx={{ pl: { sm: 5.75 }, whiteSpace: "pre-wrap", lineHeight: 1.75 }}>
                    {notice.content}
                  </Typography>

                  <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: "divider", color: "text.disabled", display: "flex", flexWrap: "wrap", gap: 1.5, ml: { sm: 5.75 }, pt: 1.25 }}>
                    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}><EventOutlinedIcon sx={{ fontSize: 16 }} /><Typography variant="caption">게시 {formatDateTime(notice.publishAt)}</Typography></Box>
                    <Typography variant="caption">노출 {formatDateTime(notice.exposureStartAt)} ~ {formatDateTime(notice.exposureEndAt)}</Typography>
                  </Box>
                </Stack>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                alignItems: "center",
                borderRadius: 2,
                bgcolor: "background.paper",
                color: "text.secondary",
                display: "flex",
                justifyContent: "center",
                minHeight: 160,
                px: 2,
                textAlign: "center",
              }}
            >
              <Stack sx={{ alignItems: "center", gap: 1 }}>
                <CampaignRoundedIcon sx={{ color: "action.disabled", fontSize: 44 }} />
                <Typography sx={{ fontWeight: 700 }}>현재 노출 중인 공지사항이 없습니다.</Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      {showTodayHideOption ? (
        <DialogActions sx={{ bgcolor: "#f6f8fc", borderTop: "1px solid", borderColor: "divider", px: 2.25, py: 1.5 }}>
          <FormControlLabel
            control={<Checkbox checked={hideToday} onChange={(event) => setHideToday(event.target.checked)} size="small" />}
            label="오늘 하루 안보기"
            sx={{ mr: "auto" }}
          />
          <Button color="inherit" onClick={handleClose} variant="outlined">
            닫기
          </Button>
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
