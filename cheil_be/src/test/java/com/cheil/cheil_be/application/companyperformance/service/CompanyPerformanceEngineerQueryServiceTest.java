package com.cheil.cheil_be.application.companyperformance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceEngineerRepository;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import org.junit.jupiter.api.Test;

class CompanyPerformanceEngineerQueryServiceTest {
    private final CompanyPerformanceEngineerRepository repository = mock(CompanyPerformanceEngineerRepository.class);
    private final CompanyPerformanceEngineerQueryService service =
            new CompanyPerformanceEngineerQueryService(mock(EngineerMasterRepository.class), repository);

    @Test
    void createsHistoryWithSelectedContractPeriodAndReturnsTheInsertedHistory() {
        var command = command(12L);
        var saved = mock(CompanyPerformanceEngineerResult.class);
        when(repository.contractPeriodBelongsToPerformance(3L, 12L)).thenReturn(true);
        when(repository.create(3L, command)).thenReturn(41L);
        when(repository.findById(3L, 41L)).thenReturn(saved);

        assertThat(service.create(3L, command)).isSameAs(saved);
    }

    @Test
    void allowsClearingTheContractPeriod() {
        var command = command(null);
        var saved = mock(CompanyPerformanceEngineerResult.class);
        when(repository.update(3L, 41L, command)).thenReturn(1);
        when(repository.findById(3L, 41L)).thenReturn(saved);

        assertThat(service.update(3L, 41L, command)).isSameAs(saved);
        verify(repository).update(3L, 41L, command);
        verify(repository).findById(3L, 41L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void rejectsMissingPeriodsOrPeriodsFromDifferentPerformances() {
        assertThatExceptionOfType(ApplicationException.class)
                .isThrownBy(() -> service.update(3L, 41L, command(12L)))
                .satisfies(error -> assertThat(error.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));

        verify(repository).contractPeriodBelongsToPerformance(3L, 12L);
        verifyNoMoreInteractions(repository);
    }

    private CompanyPerformanceEngineerCommand command(Long contractPeriodId) {
        return new CompanyPerformanceEngineerCommand(
                "ENG-1", "20260101", "20260401", contractPeriodId,
                null, null, "Y", "Y", null, null, null, null, null, null, null, null);
    }
}
