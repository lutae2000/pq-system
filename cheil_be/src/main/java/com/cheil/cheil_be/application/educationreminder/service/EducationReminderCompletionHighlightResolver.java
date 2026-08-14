package com.cheil.cheil_be.application.educationreminder.service;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderHighlightTone;

@Component
class EducationReminderCompletionHighlightResolver {

    private static final int UPCOMING_WARNING_DAYS = 30;

    EducationReminderHighlightTone resolve(String scheduledEducation1, String scheduledEducation2, boolean educationRegistered) {
        if (educationRegistered) {
            return EducationReminderHighlightTone.NONE;
        }

        LocalDate today = LocalDate.now();
        if (isAfterToday(scheduledEducation1, today) || isAfterToday(scheduledEducation2, today)) {
            return EducationReminderHighlightTone.OVERDUE;
        }
        if (isWithinRecentWindow(scheduledEducation1, today, UPCOMING_WARNING_DAYS)
                || isWithinRecentWindow(scheduledEducation2, today, UPCOMING_WARNING_DAYS)) {
            return EducationReminderHighlightTone.UPCOMING;
        }
        return EducationReminderHighlightTone.NONE;
    }

    private boolean isAfterToday(String value, LocalDate today) {
        LocalDate date = EducationReminderDateUtils.parseResponseDate(value);
        return date != null && date.isAfter(today);
    }

    private boolean isWithinRecentWindow(String value, LocalDate today, int days) {
        LocalDate date = EducationReminderDateUtils.parseResponseDate(value);
        return date != null && !date.isBefore(today.minusDays(days)) && !date.isAfter(today);
    }
}
