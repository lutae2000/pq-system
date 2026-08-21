package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderTemplateRequest(
        Long id,
        String name,
        String channel,
        String title,
        String description,
        String homepageUrl,
        String content,
        Boolean active
) {
}
