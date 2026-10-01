const root = ["education-reminders", "send-history"] as const;

export const educationReminderSendHistoryQueryKeys = {
  all: root,
  list: (params: unknown) => [...root, "list", params] as const,
} as const;
