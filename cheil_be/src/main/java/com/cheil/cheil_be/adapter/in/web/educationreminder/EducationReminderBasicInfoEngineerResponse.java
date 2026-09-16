package com.cheil.cheil_be.adapter.in.web.educationreminder;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderAssignedEngineer;

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
    public static EducationReminderBasicInfoEngineerResponse from(
            EducationReminderAssignedEngineer engineer
    ) {
        return new EducationReminderBasicInfoEngineerResponse(
                engineer.basicInfoCode(),
                engineer.engineerId(),
                engineer.engineerName(),
                engineer.departmentName(),
                engineer.grade(),
                engineer.jobField(),
                engineer.specialtyField(),
                engineer.retireYn(),
                engineer.phoneNo(),
                engineer.createdAt(),
                engineer.createdId(),
                engineer.lastChangedAt(),
                engineer.lastChangedId()
        );
    }
}
