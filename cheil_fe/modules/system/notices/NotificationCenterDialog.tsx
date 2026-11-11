"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import { Box, Dialog, DialogContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import type { NoticeRecord } from "./notice.types";

type NotificationCenterDialogProps = {
  notices: NoticeRecord[];
  onClose: () => void;
  onNoticeDismiss: (notice: NoticeRecord) => void;
  onNoticeClick: (notice: NoticeRecord) => void;
  open: boolean;
  readNoticeIds: ReadonlySet<string>;
  hiddenNoticeIds: ReadonlySet<string>;
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 16);

export function NotificationCenterDialog({ notices, onClose, onNoticeClick, onNoticeDismiss, open, readNoticeIds, hiddenNoticeIds }: NotificationCenterDialogProps) {
  const sortedNotices = notices
    .filter((notice) => !hiddenNoticeIds.has(notice.id))
    .sort((left, right) => right.publishAt.localeCompare(left.publishAt));

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open} slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: "hidden" } } }}>
      <Box sx={{ alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.16)", borderRadius: 1.5, display: "flex", height: 32, justifyContent: "center", width: 32 }}>
            <NotificationsActiveRoundedIcon fontSize="small" />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>알림사항</Typography>
        </Stack>
        <IconButton aria-label="알림사항 닫기" onClick={onClose} size="small" sx={{ color: "inherit" }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ bgcolor: "#f6f8fc", maxHeight: "min(560px, 70vh)", overflowY: "auto", p: 1.25 }}>
        {sortedNotices.length === 0 ? (
          <Box sx={{ alignItems: "center", color: "text.secondary", display: "flex", flexDirection: "column", gap: 0.75, justifyContent: "center", minHeight: 160, textAlign: "center" }}>
            <NotificationsActiveRoundedIcon sx={{ color: "action.disabled", fontSize: 38 }} />
            <Typography sx={{ fontWeight: 700 }}>새로운 알림사항이 없습니다.</Typography>
            <Typography variant="body2">알림 설정이 켜진 메뉴의 새로운 알림이 이곳에 표시됩니다.</Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            {sortedNotices.map((notice) => (
              <Box key={notice.id} sx={{ alignItems: "center", bgcolor: readNoticeIds.has(notice.id) ? "#f1f3f5" : "background.paper", border: "1px solid", borderColor: readNoticeIds.has(notice.id) ? "divider" : "primary.light", borderRadius: 1.5, boxShadow: readNoticeIds.has(notice.id) ? "none" : "0 2px 8px rgba(15, 23, 42, 0.06)", display: "flex", gap: 1, px: 1.25, py: 1, transition: "background-color 120ms ease" }}>
                <Box sx={{ alignItems: "center", bgcolor: readNoticeIds.has(notice.id) ? "action.hover" : "rgba(25, 118, 210, 0.08)", borderRadius: 1.25, color: readNoticeIds.has(notice.id) ? "text.disabled" : "primary.main", display: "flex", flex: "0 0 auto", height: 32, justifyContent: "center", width: 32 }}>
                  <NotificationsActiveRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box onClick={() => onNoticeClick(notice)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onNoticeClick(notice); }} role="button" tabIndex={0} sx={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.6} sx={{ alignItems: "center", minWidth: 0 }}>
                    {readNoticeIds.has(notice.id) ? null : <Box aria-label="읽지 않은 알림" sx={{ bgcolor: "primary.main", borderRadius: "50%", flex: "0 0 auto", height: 6, width: 6 }} />}
                    <Typography noWrap sx={{ flex: 1, fontSize: 13, fontWeight: readNoticeIds.has(notice.id) ? 400 : 800, color: readNoticeIds.has(notice.id) ? "text.secondary" : "text.primary" }} variant="subtitle2">{notice.title}</Typography>
                    <Typography color="text.disabled" sx={{ flex: "0 0 auto", fontSize: 10.5 }} variant="caption">{formatDateTime(notice.publishAt)}</Typography>
                  </Stack>
                  <Typography color={readNoticeIds.has(notice.id) ? "text.disabled" : "text.secondary"} noWrap sx={{ fontSize: 12, mt: 0.15 }} variant="body2">{notice.content}</Typography>
                </Box>
                <Stack direction="row" spacing={0} sx={{ alignItems: "center", flex: "0 0 auto" }}>
                  <Tooltip title="알림 삭제">
                    <IconButton aria-label="알림 삭제" onClick={(event) => { event.stopPropagation(); onNoticeDismiss(notice); }} size="small" sx={{ p: 0.5 }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
