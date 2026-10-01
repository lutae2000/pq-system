import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listEducationReminderSendHistory, retryEducationReminderSend } from "@/modules/education-reminders/send/api";
import type { EducationReminderSendRetryRequest } from "@/modules/education-reminders/send/types";
import { educationReminderSendHistoryQueryKeys } from "@/modules/education-reminders/send-history/application/queryKeys";

export function useEducationReminderSendHistory({
  canRetry,
  enabled,
  params,
  onError,
  onSuccess,
}: {
  canRetry: boolean;
  enabled: boolean;
  params: {
    channel?: string;
    keyword?: string;
    requestedFrom?: string;
    requestedTo?: string;
    status?: string;
  };
  onError: (error: unknown) => void;
  onSuccess: (insertedCount: number) => void;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: educationReminderSendHistoryQueryKeys.list(params),
    queryFn: () => listEducationReminderSendHistory(params),
    enabled,
  });
  const retryMutation = useMutation({
    mutationFn: (request: EducationReminderSendRetryRequest) => {
      if (!canRetry) throw new Error("교육알림 재발송 권한이 없습니다.");
      if (request.items.length === 0) throw new Error("재발송할 이력을 선택해 주세요.");
      return retryEducationReminderSend(request);
    },
    onSuccess: (response) => {
      onSuccess(response.insertedCount);
      void queryClient.invalidateQueries({ queryKey: educationReminderSendHistoryQueryKeys.all });
    },
    onError,
  });
  return { query, retryMutation };
}
