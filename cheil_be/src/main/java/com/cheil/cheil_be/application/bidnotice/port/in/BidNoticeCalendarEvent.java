package com.cheil.cheil_be.application.bidnotice.port.in;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BidNoticeCalendarEvent(
        Long bidSeq,
        String projectName,
        String orderClient,
        String orderClientName,
        BidNoticeCalendarEventType eventType,
        LocalDateTime scheduledAt,
        LocalDate scheduledDate
) {
}
