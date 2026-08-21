package com.cheil.cheil_be.adapter.in.web.educationreminder;

import java.util.List;

public record EducationReminderSendRetryRequest(
        List<Item> items
) {
    public record Item(
            Long logId,
            String actualPhoneNo
    ) {
    }
}
