"use client";

import { GlobalStyles } from "@mui/material";

import {
  scheduleLabels as defaultScheduleLabels,
  type DashboardScheduleEventType,
  type DashboardScheduleLabel,
} from "./dashboardSchedule.data";

const popoverSelector = '[role="dialog"][data-date]';
const categoryHeaderSelector = defaultScheduleLabels
  .map((label) => `.dashboard-calendar-category-popover [role="listitem"][data-schedule-category="${label.type}"]:not([data-schedule-category="${label.type}"] ~ [data-schedule-category="${label.type}"])::before`)
  .join(", ");

export function DashboardSchedulePopoverStyles() {
  return (
    <GlobalStyles
      styles={{
        ".dashboard-calendar-category-popover": {
          maxHeight: "min(70vh, 560px)",
        },
        ".dashboard-calendar-category-popover > div:has(> [role='list'])": {
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
        },
        [categoryHeaderSelector]: {
          backgroundColor: "color-mix(in srgb, var(--schedule-category-color) 9%, white)",
          borderLeft: "3px solid var(--schedule-category-color)",
          color: "var(--schedule-category-color)",
          content: "attr(data-category-label)",
          display: "block",
          fontSize: "0.8rem",
          fontWeight: 700,
          margin: "10px 0 5px",
          padding: "6px 8px",
        },
      }}
    />
  );
}

function keepPopoverInViewport(popover: HTMLElement) {
  const viewportPadding = 12;
  const bounds = popover.getBoundingClientRect();
  const overflow = bounds.bottom - (window.innerHeight - viewportPadding);

  if (overflow > 0) {
    const shift = Math.min(overflow, Math.max(0, bounds.top - viewportPadding));
    popover.style.top = `${(Number.parseFloat(popover.style.top) || 0) - shift}px`;
  }
}

export function mountDashboardSchedulePopoverHeader(element: HTMLElement, dayNumberText: string, weekdayText: string) {
  const popover = element.closest<HTMLElement>(popoverSelector);
  if (popover) {
    popover.classList.add("dashboard-calendar-category-popover");
    requestAnimationFrame(() => {
      if (popover.isConnected) keepPopoverInViewport(popover);
    });
  }

  for (const child of element.children) {
    (child as HTMLElement).style.display = "none";
  }

  const dateLabel = document.createElement("span");
  dateLabel.textContent = `${dayNumberText}일(${weekdayText})`;
  dateLabel.style.fontSize = "1rem";
  dateLabel.style.fontWeight = "700";
  dateLabel.style.whiteSpace = "nowrap";
  element.appendChild(dateLabel);
}

export function mountDashboardSchedulePopoverEvent(
  element: HTMLElement,
  eventType: DashboardScheduleEventType | undefined,
  scheduleLabels: DashboardScheduleLabel[],
) {
  if (!element.closest(popoverSelector)) return;

  const listItem = element.closest<HTMLElement>('[role="listitem"]');
  const category = scheduleLabels.find((item) => item.type === eventType);
  if (!listItem || !category) return;

  listItem.dataset.scheduleCategory = category.type;
  listItem.dataset.categoryLabel = category.label;
  listItem.style.setProperty("--schedule-category-color", category.color);
}
