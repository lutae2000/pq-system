package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderCompletionResponse(
        String rowKey,
        String engineerId,
        String name,
        String department,
        String grade,
        String retireYn,
        String jobField,
        String specialtyField,
        String hasProfessionalCert,
        String professionalCertNames,
        String educationCode,
        String educationName,
        String recentEducationStartDate1,
        String recentEducationStartDate2,
        String scheduledEducation1,
        String scheduledEducation2,
        EducationReminderHighlightTone highlightTone,
        Boolean educationRegistered,
        String remark,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
