package com.cheil.cheil_be.application.educationreminder.model;

public record EducationReminderMessageSendResult(
        boolean success,
        String responsePayload,
        String failureReason
) {
    public static EducationReminderMessageSendResult success(String responsePayload) {
        return new EducationReminderMessageSendResult(true, responsePayload, null);
    }

    public static EducationReminderMessageSendResult failure(String failureReason, String responsePayload) {
        return new EducationReminderMessageSendResult(false, responsePayload, failureReason);
    }
}
