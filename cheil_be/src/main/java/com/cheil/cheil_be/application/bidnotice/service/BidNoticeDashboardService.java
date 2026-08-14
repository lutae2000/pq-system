package com.cheil.cheil_be.application.bidnotice.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Service
@RequiredArgsConstructor
public class BidNoticeDashboardService {

    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final BidNoticeRepository bidNoticeRepository;

    @Transactional(readOnly = true)
    public List<BidNoticeCalendarEvent> findCalendarByMonth(int year, int month, String departmentCode) {
        YearMonth yearMonth = toYearMonth(year, month);
        return findCalendarByMonth(yearMonth, departmentCode);
    }

    @Transactional(readOnly = true)
    public List<BidNoticeCalendarEvent> findCalendarByYearMonth(String yearMonth, String departmentCode) {
        return findCalendarByMonth(toYearMonth(yearMonth), departmentCode);
    }

    private List<BidNoticeCalendarEvent> findCalendarByMonth(YearMonth yearMonth, String departmentCode) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        String normalizedDepartmentCode = StringUtils.hasText(departmentCode) && !"All".equalsIgnoreCase(departmentCode.trim())
                ? departmentCode.trim()
                : null;

        return bidNoticeRepository.findAllByCalendarDateBetween(startDate, endDate, normalizedDepartmentCode)
                .stream()
                .flatMap(bidNotice -> java.util.stream.Stream.of(
                        toEvent(bidNotice, BidNoticeCalendarEventType.PQ_SUBMIT, bidNotice.pqSubmitDate(), yearMonth),
                        toEvent(bidNotice, BidNoticeCalendarEventType.BID_DATE, bidNotice.bidDate(), yearMonth)
                ))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(BidNoticeCalendarEvent::scheduledAt)
                        .thenComparing(BidNoticeCalendarEvent::bidSeq)
                        .thenComparing(event -> event.eventType().name()))
                .toList();
    }

    private BidNoticeCalendarEvent toEvent(
            BidNotice bidNotice,
            BidNoticeCalendarEventType eventType,
            LocalDateTime scheduledAt,
            YearMonth yearMonth
    ) {
        if (scheduledAt == null || !YearMonth.from(scheduledAt).equals(yearMonth)) {
            return null;
        }
        return new BidNoticeCalendarEvent(
                bidNotice.bidSeq(),
                bidNotice.projectName(),
                bidNotice.orderClient(),
                eventType,
                scheduledAt,
                scheduledAt.toLocalDate()
        );
    }

    private YearMonth toYearMonth(int year, int month) {
        if (year < 1900 || year > 9999) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "year must be between 1900 and 9999.");
        }
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be between 1 and 12.");
        }
        return YearMonth.of(year, month);
    }

    private YearMonth toYearMonth(String yearMonth) {
        if (yearMonth == null || !yearMonth.matches("\\d{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "yearMonth must be in yyyyMM format.");
        }

        try {
            return YearMonth.parse(yearMonth, YEAR_MONTH_FORMATTER);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "yearMonth must be in yyyyMM format.");
        }
    }
}
