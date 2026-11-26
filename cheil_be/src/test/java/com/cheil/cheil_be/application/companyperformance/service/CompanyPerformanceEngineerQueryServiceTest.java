package com.cheil.cheil_be.application.companyperformance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

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
    void createsHistoryAndReturnsTheInsertedHistory() {
        var command = command();
        var saved = mock(CompanyPerformanceEngineerResult.class);
        when(repository.create(3L, command)).thenReturn(41L);
        when(repository.findById(3L, 41L)).thenReturn(saved);

        assertThat(service.create(3L, command)).isSameAs(saved);
    }

    @Test
    void updatesHistoryAndReturnsTheUpdatedHistory() {
        var command = command();
        var saved = mock(CompanyPerformanceEngineerResult.class);
        when(repository.update(3L, 41L, command)).thenReturn(1);
        when(repository.findById(3L, 41L)).thenReturn(saved);

        assertThat(service.update(3L, 41L, command)).isSameAs(saved);
        verify(repository).update(3L, 41L, command);
        verify(repository).findById(3L, 41L);
        verifyNoMoreInteractions(repository);
    }

    private CompanyPerformanceEngineerCommand command() {
        return new CompanyPerformanceEngineerCommand(
                "ENG-1", "20260101", "20260401",
                null, null, "Y", "Y", null, null, null, null, null, null, null);
    }
}
