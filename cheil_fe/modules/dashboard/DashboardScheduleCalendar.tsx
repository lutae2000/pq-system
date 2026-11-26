"use client";

import dayjs from "dayjs";
import koLocale from "@fullcalendar/react/locales/ko";
import EventCalendar from "@fullcalendar/mui/monarch/EventCalendar";
import { Box, Chip, FormControlLabel, LinearProgress, Stack, Switch, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { dashboardQueryKeys } from "@/modules/dashboard/application/queryKeys";

import { AutoCompleteField } from "@/components/common/AutoCompleteField";
import { useTabActivity } from "@/components/layout/TabActivityContext";

import { listDashboardBidNoticeCalendar } from "./dashboard.api";
import {
  DashboardSchedulePopoverStyles,
  mountDashboardSchedulePopoverEvent,
  mountDashboardSchedulePopoverHeader,
} from "./DashboardSchedulePopover";
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

const categoryOrder: Record<DashboardScheduleEventType, number> = {
  PQ_SUBMIT: 0,
  BID_DATE: 1,
  INTERVIEW_DATE: 2,
};

const toDashboardScheduleEvent = (item: Awaited<ReturnType<typeof listDashboardBidNoticeCalendar>>[number]): DashboardScheduleEvent => {
  const label = scheduleLabelByType[item.eventType];

  return {
    bidSeq: item.bidSeq,
    eventType: item.eventType,
    id: `${item.bidSeq}-${item.eventType}-${item.scheduledAt}`,
    title: item.projectName,
    start: item.eventType === "INTERVIEW_DATE" ? item.scheduledDate : item.scheduledAt,
    color: label?.color ?? "#2563eb",
    categoryOrder: categoryOrder[item.eventType],
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
  const [showInstitutionOnly, setShowInstitutionOnly] = useState(true);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: dashboardQueryKeys.bidNoticeCalendar(yearMonth, departmentCode),
    queryFn: () => listDashboardBidNoticeCalendar(yearMonth, departmentCode),
    enabled: isTabActive,
  });

  const events = useMemo(
    () =>
      (data ?? [])
        .filter((item) => activeStatuses.includes(item.eventType))
        .map((item) => {
          const event = toDashboardScheduleEvent(item);
          const institutionName = item.orderClientName?.trim();
          const title = showInstitutionOnly
            ? institutionName || "수요기관 미등록"
            : [institutionName, event.title].filter(Boolean).join(" · ");
          return {
            ...event,
            title,
            projectName: event.title,
            allDay: event.eventType === "INTERVIEW_DATE" || !event.start.includes("T"),
          };
        }),
    [activeStatuses, data, showInstitutionOnly],
  );

  return (
    <Stack spacing={2}>
      <DashboardSchedulePopoverStyles />
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

        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showInstitutionOnly}
                onChange={(_, checked) => setShowInstitutionOnly(checked)}
                size="small"
              />
            }
            label="수요기관만 표시"
            sx={{ m: 0, whiteSpace: "nowrap" }}
          />
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Typography sx={{ color: "text.secondary", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>
              부서
            </Typography>
            <AutoCompleteField mode="select"
              label=""
              onChange={(value) => setDepartmentCode(value)}
              source={{ type: "department" }} enabled={isTabActive}
              placeholder="전체"
              placeholderDisabled={false}
              size="small"
              sx={{ width: 150 }}
              value={departmentCode}
            />
          </Box>
        </Box>
      </Box>

      {isLoading || isFetching ? <LinearProgress /> : null}

      <Box
        sx={{
          "& .dashboard-calendar": {
            "--mui-palette-secondary-main": "#2563eb",
            "--mui-palette-secondary-contrastText": "#ffffff",
            "--mui-palette-secondary-mainChannel": "37 99 235",
          },
          "& .dashboard-calendar .MuiToggleButtonGroup-root": {
            display: "none",
          },
          "& .dashboard-calendar > .MuiBox-root:first-child": {
            position: "relative",
          },
          "& .dashboard-calendar > .MuiBox-root:first-child > .MuiBox-root:first-child": {
            flexWrap: { xs: "wrap", sm: "nowrap" },
            width: "100%",
          },
          "& .dashboard-calendar > .MuiBox-root:first-child > .MuiBox-root:first-child > .MuiTypography-root": {
            left: { sm: "50%" },
            order: { xs: -1, sm: 0 },
            position: { xs: "static", sm: "absolute" },
            textAlign: "center",
            transform: { sm: "translateX(-50%)" },
            width: { xs: "100%", sm: "auto" },
          },
          '& .dashboard-calendar [data-date][aria-current="date"], & .dashboard-calendar [data-date][aria-current="date"] .fc-daygrid-day-frame, & .dashboard-calendar [data-date][aria-current="date"] .fc-timegrid-col-frame': {
            backgroundColor: "#fff8dc !important",
          },
          "& .dashboard-calendar-event": {
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: 700,
          },
          "& .dashboard-calendar .dashboard-calendar-month-event": {
            border: "0 !important",
            boxShadow: "none !important",
            outline: "0 !important",
            "&:focus-visible": {
              outline: "2px solid #2563eb !important",
              outlineOffset: "2px",
            },
          },
        }}
      >
        <EventCalendar
          allDaySlot={false}
          aspectRatio={2}
          availableViews={["dayGridMonth"]}
          blockEventClass="dashboard-calendar-event"
          className="dashboard-calendar"
          dayMaxEventRows={4}
          dayHeaderDidMount={(info) => {
            if (!info.inPopover) return;
            mountDashboardSchedulePopoverHeader(info.el, info.dayNumberText, info.weekdayText);
          }}
          datesSet={(arg) => {
            setYearMonth(dayjs(arg.view.currentStart).format("YYYYMM"));
          }}
          editable={false}
          eventContrastColor="#111827"
          eventOrder="categoryOrder,start,projectName"
          eventOrderStrict
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventDidMount={(info) => {
            info.el.title = info.event.extendedProps.projectName ?? info.event.title;

            if (info.view.type === "dayGridMonth") {
              info.el.classList.add("dashboard-calendar-month-event");
            }

            const type = info.event.extendedProps.eventType as DashboardScheduleEventType | undefined;
            mountDashboardSchedulePopoverEvent(info.el, type, scheduleLabels);
          }}
          eventClick={(info) => {
            if (!onScheduleClick) {
              return;
            }

            const event = info.event.extendedProps as Partial<DashboardScheduleEvent> & { projectName?: string };
            onScheduleClick({
              bidSeq: event.bidSeq ?? 0,
              eventType: event.eventType ?? event.status ?? "PQ_SUBMIT",
              id: info.event.id,
              title: event.projectName ?? info.event.title,
              start: info.event.startStr,
              end: info.event.endStr || undefined,
              color: event.color ?? "#2563eb",
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
          locale={koLocale}
          moreLinkClick="popover"
          selectable={false}
          timeZone="Asia/Seoul"
          weekends
        />
      </Box>
    </Stack>
  );
}
