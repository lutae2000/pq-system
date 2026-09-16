"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import { Box, Chip, Dialog, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import type { NoticeRecord } from "./notice.types";

type NotificationCenterDialogProps = {
  notices: NoticeRecord[];
  onClose: () => void;
  onMuteMenu: (targetPath: string) => void;
  onNoticeClick: (notice: NoticeRecord) => void;
  open: boolean;
  readNoticeIds: ReadonlySet<string>;
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 16);

export function NotificationCenterDialog({ notices, onClose, onMuteMenu, onNoticeClick, open, readNoticeIds }: NotificationCenterDialogProps) {
  const sortedNotices = [...notices].sort((left, right) => right.publishAt.localeCompare(left.publishAt));

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open} slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: "hidden" } } }}>
      <Box sx={{ alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.16)", borderRadius: 1.5, display: "flex", height: 32, justifyContent: "center", width: 32 }}>
            <NotificationsActiveRoundedIcon fontSize="small" />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>업무 알림</Typography>
          <Chip label={`${sortedNotices.length}건`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit", fontSize: 11, fontWeight: 700, height: 22 }} />
        </Stack>
        <IconButton aria-label="업무 알림 닫기" onClick={onClose} size="small" sx={{ color: "inherit" }}><CloseRoundedIcon /></IconButton>
      </Box>

      <DialogContent sx={{ bgcolor: "#f6f8fc", maxHeight: "min(560px, 70vh)", overflowY: "auto", p: 1.25 }}>
        {sortedNotices.length === 0 ? (
          <Box sx={{ alignItems: "center", color: "text.secondary", display: "flex", flexDirection: "column", gap: 0.75, justifyContent: "center", minHeight: 160, textAlign: "center" }}>
            <NotificationsActiveRoundedIcon sx={{ color: "action.disabled", fontSize: 38 }} />
            <Typography sx={{ fontWeight: 700 }}>새로운 업무 알림이 없습니다.</Typography>
            <Typography variant="body2">알림 수신을 설정한 메뉴의 신규 등록 내역이 여기에 표시됩니다.</Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            {sortedNotices.map((notice) => {
              const isRead = readNoticeIds.has(notice.id);
              return (
                <Box key={notice.id} sx={{ alignItems: "center", bgcolor: isRead ? "rgba(255,255,255,0.68)" : "background.paper", border: "1px solid", borderColor: isRead ? "divider" : "primary.light", borderRadius: 1.5, boxShadow: isRead ? "none" : "0 2px 8px rgba(15, 23, 42, 0.06)", display: "flex", gap: 1, opacity: isRead ? 0.72 : 1, px: 1.25, py: 1, transition: "background-color 120ms ease, opacity 120ms ease", "&:hover": { bgcolor: "background.paper", opacity: 1 } }}>
                  <Box sx={{ alignItems: "center", bgcolor: "rgba(25, 118, 210, 0.08)", borderRadius: 1.25, color: "primary.main", display: "flex", flex: "0 0 auto", height: 32, justifyContent: "center", width: 32 }}>
                    <NotificationsActiveRoundedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box onClick={() => onNoticeClick(notice)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onNoticeClick(notice); }} sx={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: "center", minWidth: 0 }}>
                      {!isRead ? <Box aria-label="읽지 않음" sx={{ bgcolor: "primary.main", borderRadius: "50%", flex: "0 0 auto", height: 6, width: 6 }} /> : null}
                      <Typography noWrap sx={{ flex: 1, fontSize: 13, fontWeight: 800 }} variant="subtitle2">{notice.title}</Typography>
                      {isRead ? <Chip label="읽음" size="small" variant="outlined" sx={{ fontSize: 10, height: 19 }} /> : null}
                      <Typography color="text.disabled" sx={{ flex: "0 0 auto", fontSize: 10.5 }} variant="caption">{formatDateTime(notice.publishAt)}</Typography>
                    </Stack>
                    <Typography color="text.secondary" noWrap sx={{ fontSize: 12, mt: 0.15 }} variant="body2">{notice.content}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0} sx={{ alignItems: "center", flex: "0 0 auto" }}>
                    {notice.targetPath ? <Tooltip title="이 메뉴 알림 미수신"><IconButton aria-label="이 메뉴 알림 미수신" onClick={() => onMuteMenu(notice.targetPath!)} size="small" sx={{ p: 0.5 }}><NotificationsOffOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip> : null}
                    <Tooltip title="등록 내역 확인"><IconButton aria-label="등록 내역 확인" color="primary" onClick={() => onNoticeClick(notice)} size="small" sx={{ p: 0.5 }}><ArrowForwardRoundedIcon sx={{ fontSize: 19 }} /></IconButton></Tooltip>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
