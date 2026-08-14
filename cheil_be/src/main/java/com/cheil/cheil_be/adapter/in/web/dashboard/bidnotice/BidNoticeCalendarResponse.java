package com.cheil.cheil_be.adapter.in.web.dashboard.bidnotice;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.cheil.cheil_be.application.bidnotice.service.BidNoticeCalendarEvent;

public record BidNoticeCalendarResponse(
        Long bidSeq,
        String projectName,
        String orderClient,
        String eventType,
        LocalDateTime scheduledAt,
        LocalDate scheduledDate
) {

    static BidNoticeCalendarResponse from(BidNoticeCalendarEvent event) {
        return new BidNoticeCalendarResponse(
                event.bidSeq(),
                event.projectName(),
                event.orderClient(),
                event.eventType().name(),
                event.scheduledAt(),
                event.scheduledDate()
        );
    }
}
