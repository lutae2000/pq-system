package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderNotificationTargetResponse(
        String rowKey,
        String engineerId,
        String name,
        String department,
        String grade,
        String jobField,
        String specialtyField,
        String hasProfessionalCert,
        String professionalCertNames,
        String targetEducationNames,
        String phoneNo,
        EducationReminderHighlightTone highlightTone
) {
}
