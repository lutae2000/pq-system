package com.cheil.cheil_be.application.educationreminder.model;

public record EducationReminderSendTemplate(
        Long id,
        String name,
        String channel,
        String content,
        boolean active
) {
}
