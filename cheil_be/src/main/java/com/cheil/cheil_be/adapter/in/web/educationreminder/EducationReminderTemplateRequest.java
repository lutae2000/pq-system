package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderTemplateRequest(
        Long id,
        String name,
        String channel,
        String title,
        String description,
        String content,
        Boolean active
) {
}
