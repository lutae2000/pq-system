package com.cheil.cheil_be.adapter.in.web.educationreminder;

import java.util.List;

public record EducationReminderSendRequest(
        List<String> targetRowKeys,
        Long templateId,
        Boolean testSend,
        String testPhoneNo,
        String manualChannel,
        String manualContent
) {
}
