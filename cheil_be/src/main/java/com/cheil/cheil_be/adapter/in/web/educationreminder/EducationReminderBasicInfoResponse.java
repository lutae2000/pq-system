package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderBasicInfoResponse(
        String code,
        String name,
        String description,
        String cycleUnit,
        Integer cycleValue,
        boolean active,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
