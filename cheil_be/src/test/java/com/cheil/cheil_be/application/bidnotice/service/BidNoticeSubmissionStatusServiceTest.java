package com.cheil.cheil_be.application.bidnotice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class BidNoticeSubmissionStatusServiceTest {
    private final BidNoticeSubmissionRepository repository = mock(BidNoticeSubmissionRepository.class);
    private final BidNoticeSubmissionStatusService service = new BidNoticeSubmissionStatusService(repository);

    @Test
    void queriesTheSelectedYearAndFivePreviousYearsUsingTheSameCutoffMonth() {
        var counts = List.of(new BidNoticeSubmissionCount("D1", 2026, 20, false),
                new BidNoticeSubmissionCount(null, 2026, 20, true));
        when(repository.countByDepartmentAndYear(2021, 2026, 10)).thenReturn(counts);

        assertThat(service.findByDepartmentAndYear(2026, 10)).isEqualTo(counts);
    }

    @ParameterizedTest
    @CsvSource({"1899, 12", "10000, 12", "2026, 0", "2026, 13"})
    void rejectsInvalidFiltersBeforeQuerying(int year, int throughMonth) {
        assertThatThrownBy(() -> service.findByDepartmentAndYear(year, throughMonth))
                .isInstanceOf(ApplicationException.class);
        verifyNoInteractions(repository);
    }
}
