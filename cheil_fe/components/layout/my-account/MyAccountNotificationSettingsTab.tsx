"use client";

import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { Box, Stack, Switch, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { listNotificationPreferenceOptions, saveNotificationPreference, type NotificationPreferenceOption } from "@/modules/system/notices/api";

export function MyAccountNotificationSettingsTab({ active }: { active: boolean }) {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useAppSnackbar();
  const preferencesQuery = useQuery({ queryKey: ["notification-preference-options"], queryFn: listNotificationPreferenceOptions, enabled: active });
  const preferenceMutation = useMutation({
    mutationFn: ({ menuPath, receiveYn }: { menuPath: string; receiveYn: boolean }) => saveNotificationPreference(menuPath, receiveYn),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      await queryClient.invalidateQueries({ queryKey: ["notification-preference-options"] });
      showSuccess("알림 수신 설정을 변경했습니다.");
    },
    onError: () => showError("알림 수신 설정을 변경하지 못했습니다."),
  });
  const columns = useMemo<GridColDef<NotificationPreferenceOption>[]>(
    () => [
      { field: "notificationName", headerName: "알림 대상", minWidth: 145, flex: 0.8 },
      { field: "description", headerName: "알림 내용", minWidth: 230, flex: 1.4 },
      {
        field: "receiveYn",
        headerName: "수신 여부",
        align: "center",
        headerAlign: "center",
        sortable: false,
        width: 90,
        renderCell: (params) => (
          <Switch checked={params.row.receiveYn} disabled={preferencesQuery.isLoading || preferenceMutation.isPending} onChange={(_event, receiveYn) => preferenceMutation.mutate({ menuPath: params.row.menuPath, receiveYn })} size="small" slotProps={{ input: { "aria-label": `${params.row.notificationName} 알림 수신` } }} />
        ),
      },
    ],
    [preferenceMutation, preferencesQuery.isLoading],
  );

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1.25 }}>
        <NotificationsOutlinedIcon color="primary" fontSize="small" />
        <Box>
          <Typography sx={{ fontWeight: 700 }} variant="subtitle2">알림 수신 설정</Typography>
          <Typography color="text.secondary" variant="caption">업무별 신규 등록 알림을 받을지 설정합니다.</Typography>
        </Box>
      </Stack>
      <EnterpriseDataGrid<NotificationPreferenceOption> columns={columns} disableColumnMenu disableRowSelectionOnClick getRowId={(row) => row.notificationCode} hideFooter loading={preferencesQuery.isLoading} rows={preferencesQuery.data ?? []} wrapperMinHeight={220} sx={{ height: 220, "& .MuiDataGrid-cell": { fontSize: 12.5 }, "& .MuiDataGrid-columnHeaderTitle": { fontSize: 12.5, fontWeight: 800 } }} />
    </Box>
  );
}
