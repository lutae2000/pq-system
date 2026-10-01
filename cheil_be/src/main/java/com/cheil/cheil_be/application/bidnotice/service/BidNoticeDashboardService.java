package com.cheil.cheil_be.application.bidnotice.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException;
import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException.Type;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeDashboardUseCase;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeCalendarEvent;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeCalendarEventType;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Service
@RequiredArgsConstructor
public class BidNoticeDashboardService implements BidNoticeDashboardUseCase {

    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final BidNoticeRepository bidNoticeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BidNoticeCalendarEvent> findCalendarByMonth(int year, int month, String departmentCode) {
        YearMonth yearMonth = toYearMonth(year, month);
        return findCalendarByMonth(yearMonth, departmentCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BidNoticeCalendarEvent> findCalendarByYearMonth(String yearMonth, String departmentCode) {
        return findCalendarByMonth(toYearMonth(yearMonth), departmentCode);
    }

    private List<BidNoticeCalendarEvent> findCalendarByMonth(YearMonth yearMonth, String departmentCode) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        // 화면의 '전체' 선택값은 실제 조건이 아니므로 저장소에는 null로 전달합니다.
        String normalizedDepartmentCode = normalizeDepartmentCode(departmentCode);

        return bidNoticeRepository.findAllByCalendarDateBetween(startDate, endDate, normalizedDepartmentCode)
                .stream()
                .flatMap(bidNotice -> java.util.stream.Stream.of(
                        toEvent(bidNotice, BidNoticeCalendarEventType.PQ_SUBMIT, bidNotice.pqSubmitDate(), yearMonth),
                        toEvent(bidNotice, BidNoticeCalendarEventType.BID_DATE, bidNotice.bidDate(), yearMonth),
                        toEvent(bidNotice, BidNoticeCalendarEventType.INTERVIEW_DATE,
                                bidNotice.interviewDate() == null ? null : bidNotice.interviewDate().atStartOfDay(), yearMonth)
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
            throw failure("연도는 1900년부터 9999년 사이여야 합니다.");
        }
        if (month < 1 || month > 12) {
            throw failure("월은 1부터 12 사이여야 합니다.");
        }
        return YearMonth.of(year, month);
    }

    private YearMonth toYearMonth(String yearMonth) {
        if (yearMonth == null || !yearMonth.matches("\\d{6}")) {
            throw failure("yearMonth는 yyyyMM 형식이어야 합니다.");
        }

        try {
            return YearMonth.parse(yearMonth, YEAR_MONTH_FORMATTER);
        } catch (RuntimeException ex) {
            throw failure("yearMonth는 yyyyMM 형식이어야 합니다.");
        }
    }

    private String normalizeDepartmentCode(String departmentCode) {
        if (departmentCode == null || departmentCode.isBlank() || "All".equalsIgnoreCase(departmentCode.trim())) {
            return null;
        }
        return departmentCode.trim();
    }

    private static BidNoticeApplicationException failure(String message) {
        return new BidNoticeApplicationException(Type.BAD_REQUEST, message);
    }
}
