export type DashboardScheduleEventType = "PQ_SUBMIT" | "BID_DATE";

export type DashboardScheduleLabel = {
  color: string;
  label: string;
  type: DashboardScheduleEventType;
};

export type DashboardScheduleEvent = {
  bidSeq: number;
  eventType: DashboardScheduleEventType;
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  description: string;
  client: string;
  status: DashboardScheduleEventType;
  location: string;
};

export const schedulePalette = {
  pqSubmit: "#2563eb",
  bidDate: "#0f766e",
} as const;

export const scheduleLabels: DashboardScheduleLabel[] = [
  { label: "PQ 제출", color: schedulePalette.pqSubmit, type: "PQ_SUBMIT" },
  { label: "입찰일", color: schedulePalette.bidDate, type: "BID_DATE" },
];

export const scheduleLabelByType = scheduleLabels.reduce<Record<DashboardScheduleEventType, DashboardScheduleLabel>>(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<DashboardScheduleEventType, DashboardScheduleLabel>,
);
