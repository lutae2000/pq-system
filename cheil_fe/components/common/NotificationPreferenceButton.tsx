"use client";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { getNotificationPreferences, saveNotificationPreference } from "@/modules/system/notices/api";

type NotificationPreferenceButtonProps = {
  menuPath: string;
};

export function NotificationPreferenceButton({ menuPath }: NotificationPreferenceButtonProps) {
  const tabQueryEnabled = useTabQueryEnabled();
  const { showSnackbar } = useAppSnackbar();
  const preferenceQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
    enabled: tabQueryEnabled,
  });
  const preferenceMutation = useMutation({
    mutationFn: (receiveYn: boolean) => saveNotificationPreference(menuPath, receiveYn),
    onSuccess: async () => {
      await preferenceQuery.refetch();
      showSnackbar({ message: "알림 수신 설정을 저장했습니다.", severity: "success" });
    },
    onError: () => showSnackbar({ message: "알림 수신 설정을 저장하지 못했습니다.", severity: "error" }),
  });
  const receiveNotifications = preferenceQuery.data?.[menuPath] ?? false;

  return (
    <Tooltip title={receiveNotifications ? "알림 수신 중 (클릭하여 미수신)" : "알림 미수신 (클릭하여 수신)"}>
      <IconButton
        aria-label={receiveNotifications ? "알림 미수신으로 변경" : "알림 수신으로 변경"}
        color={receiveNotifications ? "success" : "default"}
        disabled={preferenceMutation.isPending}
        onClick={() => preferenceMutation.mutate(!receiveNotifications)}
        size="small"
        sx={{ border: "1px solid", borderColor: receiveNotifications ? "success.main" : "divider" }}
      >
        {receiveNotifications ? <NotificationsActiveOutlinedIcon fontSize="small" /> : <NotificationsOffOutlinedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
