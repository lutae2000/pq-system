"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { NoticeRecord } from "./notice.types";

type NoticeLayerDialogProps = {
  isLoading?: boolean;
  notices: NoticeRecord[];
  onClose: () => void;
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
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, minWidth: 0 }}>
          <CampaignOutlinedIcon />
          <Typography noWrap sx={{ fontWeight: 800 }} variant="h6">
            {title}
          </Typography>
        </Box>
        <IconButton aria-label="공지사항 닫기" onClick={handleClose} size="small" sx={{ color: "inherit" }}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ bgcolor: "background.default", p: 2.25 }}>
        <Stack spacing={1.5}>
          {isLoading ? (
            <Box
              sx={{
                alignItems: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1.5,
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
                  borderLeft: "4px solid",
                  borderLeftColor: notice.important ? "warning.main" : "primary.main",
                  borderRadius: 1.5,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack spacing={1.1}>
                  <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 800 }} variant="subtitle1">
                        {notice.title}
                      </Typography>
                      {notice.important ? <Chip color="warning" label="중요" size="small" /> : null}
                    </Box>
                  </Box>

                  <Typography color="text.secondary" variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                    {notice.content}
                  </Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Chip icon={<ScheduleOutlinedIcon />} label={`게시 ${formatDateTime(notice.publishAt)}`} size="small" variant="outlined" />
                    <Chip label={`노출 ${formatDateTime(notice.exposureStartAt)} ~ ${formatDateTime(notice.exposureEndAt)}`} size="small" variant="outlined" />
                  </Box>
                </Stack>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                alignItems: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "background.paper",
                color: "text.secondary",
                display: "flex",
                justifyContent: "center",
                minHeight: 160,
                px: 2,
                textAlign: "center",
              }}
            >
              현재 노출 중인 공지사항이 없습니다.
            </Box>
          )}
        </Stack>
      </DialogContent>

      {showTodayHideOption ? (
        <DialogActions sx={{ px: 2.25, pb: 2, pt: 0 }}>
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
