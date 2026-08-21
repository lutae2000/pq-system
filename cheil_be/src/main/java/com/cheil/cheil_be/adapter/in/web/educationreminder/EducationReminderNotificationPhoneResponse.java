package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderNotificationPhoneResponse(
        String engineerId,
        String phoneNo,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
