"use client";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import { MyAccountLoginTab } from "@/components/layout/my-account/MyAccountLoginTab";
import { MyAccountNotificationSettingsTab } from "@/components/layout/my-account/MyAccountNotificationSettingsTab";

type MyAccountDialogProps = {
  onClose: () => void;
  open: boolean;
};

export function MyAccountDialog({ onClose, open }: MyAccountDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open} slotProps={{ paper: { sx: { borderRadius: 2.5, overflow: "hidden" } } }}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", pb: 1 }}>
        내 계정 정보
        <IconButton aria-label="닫기" onClick={handleClose} size="small"><CloseOutlinedIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2 }}>
        <Tabs aria-label="내 계정 설정" onChange={(_event, value: number) => setActiveTab(value)} value={activeTab}>
          <Tab icon={<AccountCircleOutlinedIcon fontSize="small" />} iconPosition="start" label="로그인 정보" />
          <Tab icon={<NotificationsOutlinedIcon fontSize="small" />} iconPosition="start" label="알림 수신 설정" />
        </Tabs>
      </Box>
      <DialogContent sx={{ bgcolor: "background.default", p: 2 }}>
        {activeTab === 0 ? (
          <Box role="tabpanel">
            <MyAccountLoginTab active={open} onClose={handleClose} />
          </Box>
        ) : (
          <Box role="tabpanel">
            <MyAccountNotificationSettingsTab active={open} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
