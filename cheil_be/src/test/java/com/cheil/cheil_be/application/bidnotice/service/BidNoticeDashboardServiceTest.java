package com.cheil.cheil_be.application.bidnotice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeCalendarEventType;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeDashboardSummaryRepository;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDashboardSummary;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDepartmentSummary;
import java.math.BigDecimal;
import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

class BidNoticeDashboardServiceTest {

    private BidNoticeRepository repository;
    private BidNoticeDashboardSummaryRepository summaryRepository;
    private BidNoticeDashboardService service;

    @BeforeEach
    void setUp() {
        repository = mock(BidNoticeRepository.class);
        summaryRepository = mock(BidNoticeDashboardSummaryRepository.class);
        service = new BidNoticeDashboardService(repository, summaryRepository, Clock.fixed(Instant.parse("2026-11-18T00:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    void findsCurrentYearSummary() {
        var summary = new BidNoticeDashboardSummary(10, 3, new BigDecimal("150000000"));
        when(summaryRepository.findAnnualSummary(2026)).thenReturn(summary);

        assertThat(service.findAnnualSummary()).isEqualTo(summary);
    }

    @Test
    void findsCurrentYearDepartmentSummaries() {
        var departments = List.of(new BidNoticeDepartmentSummary("D1", "설계부", 10, 3, new BigDecimal("150000000")));
        when(summaryRepository.findAnnualDepartmentSummaries(2026)).thenReturn(departments);

        assertThat(service.findAnnualDepartmentSummaries()).isEqualTo(departments);
    }

    @Test
    void findsCalendarEventsAndTreatsAllDepartmentAsUnfiltered() {
        BidNotice bidNotice = mock(BidNotice.class);
        when(bidNotice.bidSeq()).thenReturn(10L);
        when(bidNotice.projectName()).thenReturn("프로젝트");
        when(bidNotice.orderClient()).thenReturn("발주처");
        when(bidNotice.pqSubmitDate()).thenReturn(LocalDateTime.of(2026, 10, 20, 9, 0));
        when(bidNotice.bidDate()).thenReturn(LocalDateTime.of(2026, 10, 5, 9, 0));
        when(bidNotice.interviewDate()).thenReturn(LocalDate.of(2026, 10, 12));
        when(repository.findAllByCalendarDateBetween(
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                null
        )).thenReturn(List.of(bidNotice));

        var events = service.findCalendarByMonth(2026, 10, " All ");

        assertThat(events).extracting(event -> event.eventType())
                .containsExactly(
                        BidNoticeCalendarEventType.BID_DATE,
                        BidNoticeCalendarEventType.INTERVIEW_DATE,
                        BidNoticeCalendarEventType.PQ_SUBMIT
                );
        assertThat(events).extracting(event -> event.scheduledDate())
                .containsExactly(
                        LocalDate.of(2026, 10, 5),
                        LocalDate.of(2026, 10, 12),
                        LocalDate.of(2026, 10, 20)
                );
    }

    @Test
    void rejectsInvalidCalendarMonthWithoutCallingRepository() {
        assertThatThrownBy(() -> service.findCalendarByMonth(2026, 13, null))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
    }

    @Test
    void rejectsInvalidYearMonthFormat() {
        assertThatThrownBy(() -> service.findCalendarByYearMonth("202613", null))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
    }
}
