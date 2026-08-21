package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderSendHistoryResponse(
        Long logId,
        Long batchId,
        String requestedAt,
        String requestedBy,
        String templateName,
        String channel,
        String engineerName,
        String departmentName,
        String targetPhoneNo,
        String actualPhoneNo,
        String messageContent,
        String status,
        String failureReason,
        String sentAt,
        boolean testSend
) {
}
