package com.cheil.cheil_be.application.educationreminder.service;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderHighlightTone;

@Component
class EducationReminderCompletionHighlightResolver {

    private static final int UPCOMING_WARNING_DAYS = 60;

    EducationReminderHighlightTone resolve(String scheduledEducation1, String scheduledEducation2, boolean educationRegistered) {
        if (educationRegistered) {
            return EducationReminderHighlightTone.NONE;
        }

        LocalDate today = LocalDate.now();
        if (isAfterTodayWithinWindow(scheduledEducation1, today, UPCOMING_WARNING_DAYS)
                || isAfterTodayWithinWindow(scheduledEducation2, today, UPCOMING_WARNING_DAYS)) {
            return EducationReminderHighlightTone.OVERDUE;
        }
        if (isUpcomingWithinWindow(scheduledEducation1, today, UPCOMING_WARNING_DAYS)
                || isUpcomingWithinWindow(scheduledEducation2, today, UPCOMING_WARNING_DAYS)) {
            return EducationReminderHighlightTone.UPCOMING;
        }
        return EducationReminderHighlightTone.NONE;
    }

    private boolean isAfterTodayWithinWindow(String value, LocalDate today, int days) {
        LocalDate date = EducationReminderDateUtils.parseResponseDate(value);
        return date != null && date.isAfter(today) && !date.isAfter(today.plusDays(days));
    }

    private boolean isUpcomingWithinWindow(String value, LocalDate today, int days) {
        LocalDate date = EducationReminderDateUtils.parseResponseDate(value);
        return date != null && !date.isBefore(today.minusDays(days)) && !date.isAfter(today);
    }
}
