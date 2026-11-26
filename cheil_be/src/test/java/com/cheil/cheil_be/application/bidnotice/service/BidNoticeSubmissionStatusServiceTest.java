package com.cheil.cheil_be.application.bidnotice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class BidNoticeSubmissionStatusServiceTest {
    private final BidNoticeSubmissionRepository repository = mock(BidNoticeSubmissionRepository.class);
    private final BidNoticeSubmissionStatusService service = new BidNoticeSubmissionStatusService(repository);

    @Test
    void queriesTheSelectedYearAndFivePreviousYearsUsingTheSameCutoffMonth() {
        var counts = List.of(new BidNoticeSubmissionCount("D1", 2026, 20, 3, false),
                new BidNoticeSubmissionCount(null, 2026, 20, 3, true));
        when(repository.countByDepartmentAndYear(2021, 2026, 10)).thenReturn(counts);

        assertThat(service.findByDepartmentAndYear(2026, 10)).isEqualTo(counts);
    }

    @Test
    void passesDepartmentAndPeriodForTheSelectedCell() {
        var query = new BidNoticeSubmissionDetailQuery(2021, 2026, 6, 6, null, false);
        var page = PageRequest.of(1, 25);
        when(repository.findDetails(query, page)).thenReturn(Page.empty(page));

        assertThat(service.findDetails(query, page).getPageable()).isEqualTo(page);
    }

    @ParameterizedTest
    @CsvSource({"2020, 2026, 1, 6", "2027, 2026, 1, 6", "2026, 2026, 7, 6", "2026, 2026, 1, 13"})
    void rejectsInvalidDetailPeriods(int firstYear, int lastYear, int fromMonth, int throughMonth) {
        var query = new BidNoticeSubmissionDetailQuery(firstYear, lastYear, fromMonth, throughMonth, null, true);
        assertThatThrownBy(() -> service.findDetails(query, PageRequest.of(0, 25)))
                .isInstanceOf(ApplicationException.class);
        verifyNoInteractions(repository);
    }

    @ParameterizedTest
    @CsvSource({"1899, 12", "10000, 12", "2026, 0", "2026, 13"})
    void rejectsInvalidFiltersBeforeQuerying(int year, int throughMonth) {
        assertThatThrownBy(() -> service.findByDepartmentAndYear(year, throughMonth))
                .isInstanceOf(ApplicationException.class);
        verifyNoInteractions(repository);
    }
}
