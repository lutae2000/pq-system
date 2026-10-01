export const educationReminderCompletionQueryKeys = {
  all: ["education-reminders"] as const,
  completionsRoot: ["education-reminders", "completions"] as const,
  completions: (params: unknown) => ["education-reminders", "completions", params] as const,
  basicInfos: ["education-reminders", "basic-infos"] as const,
  templates: ["education-reminders", "templates"] as const,
  notificationTargets: ["education-reminders", "notification-targets"] as const,
};
