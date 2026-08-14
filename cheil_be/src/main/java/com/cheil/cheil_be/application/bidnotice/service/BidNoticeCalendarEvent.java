package com.cheil.cheil_be.application.bidnotice.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BidNoticeCalendarEvent(
        Long bidSeq,
        String projectName,
        String orderClient,
        BidNoticeCalendarEventType eventType,
        LocalDateTime scheduledAt,
        LocalDate scheduledDate
) {
}
