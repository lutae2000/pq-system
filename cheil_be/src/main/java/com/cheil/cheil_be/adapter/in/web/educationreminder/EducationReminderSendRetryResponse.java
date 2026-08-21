package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderSendRetryResponse(
        int requestedCount,
        int insertedCount,
        int batchCount
) {
}
