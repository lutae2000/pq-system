"use client";

import { useQuery } from "@tanstack/react-query";

import { listEducationReminderBasicInfos } from "@/modules/education-reminders/basic-infos/api";
import { listEducationReminderCompletions, listEducationReminderNotificationTargets } from "@/modules/education-reminders/completions/api";
import { educationReminderCompletionQueryKeys } from "@/modules/education-reminders/completions/application/queryKeys";
import { listEducationReminderTemplates } from "@/modules/education-reminders/templates/api";
import type { EducationReminderCompletionSearchParams } from "@/modules/education-reminders/types";

type Params = {
  completionSearchParams: EducationReminderCompletionSearchParams;
  sendDialogOpen: boolean;
  tabQueryEnabled: boolean;
};

export function useEducationReminderCompletions({ completionSearchParams, sendDialogOpen, tabQueryEnabled }: Params) {
  const basicInfosQuery = useQuery({
    queryKey: educationReminderCompletionQueryKeys.basicInfos,
    queryFn: listEducationReminderBasicInfos,
    enabled: tabQueryEnabled,
  });
  const templatesQuery = useQuery({
    queryKey: educationReminderCompletionQueryKeys.templates,
    queryFn: listEducationReminderTemplates,
    enabled: tabQueryEnabled,
  });
  const notificationTargetQuery = useQuery({
    queryKey: educationReminderCompletionQueryKeys.notificationTargets,
    queryFn: () => listEducationReminderNotificationTargets(),
    enabled: tabQueryEnabled && sendDialogOpen,
  });
  const completionQuery = useQuery({
    queryKey: educationReminderCompletionQueryKeys.completions(completionSearchParams),
    queryFn: () => listEducationReminderCompletions(completionSearchParams),
    enabled: tabQueryEnabled,
  });

  return { basicInfosQuery, completionQuery, notificationTargetQuery, templatesQuery };
}
