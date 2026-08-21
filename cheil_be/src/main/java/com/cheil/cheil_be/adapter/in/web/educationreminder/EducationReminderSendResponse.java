package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderSendResponse(
        Long batchId,
        int targetCount,
        int insertedCount,
        boolean testSend,
        String channel,
        String templateName,
        String previewMessage
) {
}
