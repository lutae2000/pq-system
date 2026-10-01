package com.cheil.cheil_be.application.bidnotice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException;
import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException.Type;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeCalendarEventType;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

class BidNoticeDashboardServiceTest {

    private BidNoticeRepository repository;
    private BidNoticeDashboardService service;

    @BeforeEach
    void setUp() {
        repository = mock(BidNoticeRepository.class);
        service = new BidNoticeDashboardService(repository);
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
                .isInstanceOfSatisfying(BidNoticeApplicationException.class, exception ->
                        assertThat(exception.type()).isEqualTo(Type.BAD_REQUEST));
    }

    @Test
    void rejectsInvalidYearMonthFormat() {
        assertThatThrownBy(() -> service.findCalendarByYearMonth("202613", null))
                .isInstanceOfSatisfying(BidNoticeApplicationException.class, exception ->
                        assertThat(exception.type()).isEqualTo(Type.BAD_REQUEST));
    }
}
