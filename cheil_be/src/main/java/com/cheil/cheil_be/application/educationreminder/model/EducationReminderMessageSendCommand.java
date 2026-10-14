package com.cheil.cheil_be.application.educationreminder.model;

public record EducationReminderMessageSendCommand(
        String channel,
        String receiverNumber,
        String message,
        boolean testSend
) {
}
