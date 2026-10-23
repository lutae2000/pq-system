"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveEducationReminderCompletion, saveEducationReminderNotificationPhone } from "@/modules/education-reminders/completions/api";
import { educationReminderCompletionQueryKeys } from "@/modules/education-reminders/completions/application/queryKeys";
import { createEducationReminderSend } from "@/modules/education-reminders/send/api";

export function useEducationReminderCompletionCommands({
  onError,
  onPhoneSaved,
  onSaved,
  onSendCompleted,
}: {
  onError: (error: unknown, operation: "save" | "phone" | "send") => void;
  onPhoneSaved: () => void;
  onSaved: () => void;
  onSendCompleted: (result: Awaited<ReturnType<typeof createEducationReminderSend>>) => void;
}) {
  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: saveEducationReminderCompletion,
    onSuccess: async () => {
      onSaved();
      await queryClient.invalidateQueries({ queryKey: educationReminderCompletionQueryKeys.completionsRoot });
    },
    onError: (error) => onError(error, "save"),
  });
  const savePhoneMutation = useMutation({
    mutationFn: ({ engrId, phoneNo }: { engrId: string; phoneNo: string }) => saveEducationReminderNotificationPhone(engrId, { phoneNo }),
    onSuccess: async () => {
      onPhoneSaved();
      await queryClient.invalidateQueries({ queryKey: educationReminderCompletionQueryKeys.completionsRoot });
    },
    onError: (error) => onError(error, "phone"),
  });
  const sendMutation = useMutation({
    mutationFn: createEducationReminderSend,
    onSuccess: onSendCompleted,
    onError: (error) => onError(error, "send"),
  });
  return { saveMutation, savePhoneMutation, sendMutation };
}
