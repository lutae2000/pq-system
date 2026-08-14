package com.cheil.cheil_be.adapter.in.web.educationreminder;

public record EducationReminderCompletionRequest(
        String engrId,
        String educationCode,
        String educationStartDate1,
        String educationStartDate2,
        Boolean educationRegistered,
        String remark
) {
}
