package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderBasicInfoEngineerResponse(
        String basicInfoCode,
        String engineerId,
        String engineerName,
        String departmentName,
        String grade,
        String jobField,
        String specialtyField,
        String retireYn,
        String phoneNo,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
