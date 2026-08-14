"use client";

import dayjs from "dayjs";
import koLocale from "@fullcalendar/core/locales/ko";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { CommonSelectField } from "@/components/common/CommonSelectField";
import { useTabActivity } from "@/components/layout/TabActivityContext";
import { useDepartmentOptions } from "@/modules/common/reference/useReferenceOptions";

import { listDashboardBidNoticeCalendar } from "./dashboard.api";
import {
  scheduleLabelByType,
  scheduleLabels as defaultScheduleLabels,
  type DashboardScheduleEvent,
  type DashboardScheduleEventType,
  type DashboardScheduleLabel,
} from "./dashboardSchedule.data";

export type { DashboardScheduleEvent } from "./dashboardSchedule.data";
export type DashboardScheduleClickHandler = (event: DashboardScheduleEvent) => void;

type DashboardScheduleCalendarProps = {
  onScheduleClick?: DashboardScheduleClickHandler;
  scheduleLabels?: DashboardScheduleLabel[];
};

const toDashboardScheduleEvent = (item: Awaited<ReturnType<typeof listDashboardBidNoticeCalendar>>[number]): DashboardScheduleEvent => {
  const label = scheduleLabelByType[item.eventType];

  return {
    bidSeq: item.bidSeq,
    eventType: item.eventType,
    id: `${item.bidSeq}-${item.eventType}-${item.scheduledAt}`,
    title: `${item.projectName}${label ? ` / ${label.label}` : ""}`,
    start: item.scheduledAt,
    color: label?.color ?? "#2563eb",
    description: label?.label ?? item.eventType,
    client: item.orderClient ?? "",
    status: item.eventType,
    location: "",
  };
};

export function DashboardScheduleCalendar({ onScheduleClick, scheduleLabels = defaultScheduleLabels }: DashboardScheduleCalendarProps) {
  const isTabActive = useTabActivity();
  const [activeStatuses, setActiveStatuses] = useState<DashboardScheduleEventType[]>(() => scheduleLabels.map((item) => item.type));
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYYMM"));
  const [departmentCode, setDepartmentCode] = useState("");
  const departmentOptions = useDepartmentOptions({ useYn: true }, { enabled: isTabActive });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard-bid-notice-calendar", yearMonth, departmentCode],
    queryFn: () => listDashboardBidNoticeCalendar(yearMonth, departmentCode),
    enabled: isTabActive,
  });

  const events = useMemo(
    () =>
      (data ?? [])
        .map(toDashboardScheduleEvent)
        .filter((event) => activeStatuses.includes(event.status))
        .map((event) => ({
          ...event,
          allDay: !event.start.includes("T"),
        })),
    [activeStatuses, data],
  );

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          alignItems: "flex-start",
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", flex: "1 1 auto", flexWrap: "wrap", gap: 1 }}>
          {scheduleLabels.map((item) => {
            const isActive = activeStatuses.includes(item.type);

            return (
              <Chip
                key={item.type}
                label={item.label}
                onClick={() => {
                  setActiveStatuses((current) =>
                    current.includes(item.type) ? current.filter((status) => status !== item.type) : [...current, item.type],
                  );
                }}
                size="small"
                variant={isActive ? "filled" : "outlined"}
                sx={{
                  bgcolor: isActive ? `${item.color}14` : "grey.100",
                  borderColor: isActive ? item.color : "grey.300",
                  color: isActive ? item.color : "text.secondary",
                  cursor: "pointer",
                  fontWeight: 700,
                  opacity: isActive ? 1 : 0.88,
                  "&:hover": {
                    bgcolor: isActive ? `${item.color}1f` : "grey.200",
                    borderColor: isActive ? item.color : "grey.400",
                  },
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
            );
          })}
        </Box>

        <Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto", gap: 1 }}>
          <Typography sx={{ color: "text.secondary", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>
            부서
          </Typography>
          <CommonSelectField
            label=""
            onChange={(value) => setDepartmentCode(value)}
            options={departmentOptions.options}
            placeholder="전체"
            placeholderDisabled={false}
            size="small"
            sx={{ width: 150 }}
            value={departmentCode}
          />
        </Box>
      </Box>

      {isLoading || isFetching ? <LinearProgress /> : null}

      <Box
        sx={{
          "& .fc": {
            fontFamily: "var(--font-geist-sans), sans-serif",
          },
          "& .fc .fc-toolbar-title": {
            fontSize: "1rem",
            fontWeight: 800,
          },
          "& .fc .fc-button": {
            borderRadius: 1,
            boxShadow: "none",
            fontWeight: 700,
          },
          "& .fc .fc-button-primary:not(:disabled).fc-button-active, & .fc .fc-button-primary:not(:disabled):active": {
            backgroundColor: "primary.main",
            borderColor: "primary.main",
          },
          "& .fc .fc-daygrid-day-number, & .fc .fc-col-header-cell-cushion": {
            color: "text.primary",
            textDecoration: "none",
          },
          "& .fc .fc-daygrid-event": {
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: 700,
          },
        }}
      >
        <FullCalendar
          allDaySlot={false}
          aspectRatio={1.7}
          dayMaxEventRows={4}
          datesSet={(arg) => {
            setYearMonth(dayjs(arg.view.currentStart).format("YYYYMM"));
          }}
          editable={false}
          eventClick={(info) => {
            if (!onScheduleClick) {
              return;
            }

            const event = info.event.extendedProps as Partial<DashboardScheduleEvent>;
            onScheduleClick({
              bidSeq: event.bidSeq ?? 0,
              eventType: event.eventType ?? event.status ?? "PQ_SUBMIT",
              id: info.event.id,
              title: info.event.title,
              start: info.event.startStr,
              end: info.event.endStr || undefined,
              color: event.color ?? info.event.backgroundColor ?? info.event.borderColor ?? "#2563eb",
              description: event.description ?? "",
              client: event.client ?? "",
              status: event.status ?? "PQ_SUBMIT",
              location: event.location ?? "",
            });
          }}
          events={events}
          expandRows
          firstDay={1}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="dayGridMonth"
          locale={koLocale}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          selectable={false}
          timeZone="Asia/Seoul"
          weekends
        />
      </Box>
    </Stack>
  );
}
