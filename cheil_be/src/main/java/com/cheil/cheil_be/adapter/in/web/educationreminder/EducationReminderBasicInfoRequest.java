package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderBasicInfoRequest(
        String code,
        String name,
        String description,
        String cycleUnit,
        Integer cycleValue,
        Boolean active
) {
}
