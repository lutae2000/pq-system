package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderTemplateResponse(
        Long id,
        String name,
        String channel,
        String title,
        String description,
        String content,
        boolean active,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
