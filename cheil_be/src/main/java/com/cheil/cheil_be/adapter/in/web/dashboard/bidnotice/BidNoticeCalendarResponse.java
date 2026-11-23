package com.cheil.cheil_be.adapter.in.web.dashboard.bidnotice;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeCalendarEvent;

public record BidNoticeCalendarResponse(
        Long bidSeq,
        String projectName,
        String orderClient,
        String orderClientName,
        String eventType,
        LocalDateTime scheduledAt,
        LocalDate scheduledDate
) {

    static BidNoticeCalendarResponse from(BidNoticeCalendarEvent event) {
        return new BidNoticeCalendarResponse(
                event.bidSeq(),
                event.projectName(),
                event.orderClient(),
                event.orderClientName(),
                event.eventType().name(),
                event.scheduledAt(),
                event.scheduledDate()
        );
    }
}
