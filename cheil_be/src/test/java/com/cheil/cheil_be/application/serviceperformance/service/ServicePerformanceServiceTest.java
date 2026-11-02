package com.cheil.cheil_be.application.serviceperformance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportRow;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportSearch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceQuery;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceSearch;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;

@ExtendWith(MockitoExtension.class)
class ServicePerformanceServiceTest {

    @Test
    void importedSearchNormalizesFourFilters() {
        var pageable = PageRequest.of(0, 20);
        var result = new PageImpl<com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportView>(
                List.of(), pageable, 0);
        when(repository.findImported(any(), any())).thenReturn(result);

        assertThat(service.findImported(new ServicePerformanceImportSearch(
                " 발주청 ", " 용역명 ", " 업역분류 ", " 세부분야 "), pageable)).isEqualTo(result);

        ArgumentCaptor<ServicePerformanceImportSearch> captured =
                ArgumentCaptor.forClass(ServicePerformanceImportSearch.class);
        verify(repository).findImported(captured.capture(), org.mockito.ArgumentMatchers.same(pageable));
        assertThat(captured.getValue()).isEqualTo(new ServicePerformanceImportSearch(
                "발주청", "용역명", "업역분류", "세부분야"));
    }

    @Test
    void replaceImportedNormalizesAllRowsBeforeReplacingData() {
        ServicePerformanceImportRow row = new ServicePerformanceImportRow(
                " Z22163 ", " 발주청 ", " 용역명 ", " 실시설계 ", " 수자원시설 ",
                new BigDecimal("300504"), "2021-05-24", "2023-01-13",
                new BigDecimal("73.87"), new BigDecimal("222"),
                new BigDecimal("94.44"), "2025-04-04");
        when(currentActorPort.currentActor()).thenReturn("admin");

        assertThat(service.replaceImported(List.of(row))).isEqualTo(1);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ServicePerformanceImportRow>> rows = ArgumentCaptor.forClass(List.class);
        verify(repository).replaceImported(rows.capture(), org.mockito.ArgumentMatchers.eq("admin"));
        assertThat(rows.getValue().get(0).constructionNo()).isEqualTo("Z22163");
        assertThat(rows.getValue().get(0).serviceStartDate()).isEqualTo("20210524");
        assertThat(rows.getValue().get(0).evaluationEndDate()).isEqualTo("20250404");
    }

    @Test
    void invalidImportDoesNotReplaceExistingData() {
        ServicePerformanceImportRow invalid = new ServicePerformanceImportRow(
                "Z1", "발주청", "용역명", null, null, null, null, null,
                new BigDecimal("101"), null, null, null);
        assertThatThrownBy(() -> service.replaceImported(List.of(invalid)))
                .isInstanceOf(ApplicationException.class).hasMessageContaining("지분율");
        verify(repository, never()).replaceImported(any(), any());
    }

    @Mock
    private ServicePerformanceRepository repository;

    @Mock
    private CurrentActorPort currentActorPort;

    @InjectMocks
    private ServicePerformanceService service;

    @Test
    void createNormalizesInputAndUsesCurrentActorPort() {
        ServicePerformanceCommand command = new ServicePerformanceCommand(
                " CLIENT ", " 분야 ", " 현장 ", "2026-10-22",
                BigDecimal.valueOf(1000), BigDecimal.valueOf(95), " 비고 ");
        ServicePerformanceView saved = view(7L);
        when(currentActorPort.currentActor()).thenReturn("admin");
        when(repository.create(any(), any())).thenReturn(7L);
        when(repository.findById(7L)).thenReturn(saved);

        assertThat(service.create(command)).isEqualTo(saved);

        ArgumentCaptor<ServicePerformanceCommand> commandCaptor =
                ArgumentCaptor.forClass(ServicePerformanceCommand.class);
        verify(repository).create(commandCaptor.capture(), org.mockito.ArgumentMatchers.eq("admin"));
        assertThat(commandCaptor.getValue()).isEqualTo(new ServicePerformanceCommand(
                "CLIENT", "분야", "현장", "20261022",
                BigDecimal.valueOf(1000), BigDecimal.valueOf(95), "비고"));
    }

    @Test
    void createRejectsBlankRequiredValueBeforePersistence() {
        ServicePerformanceCommand command = new ServicePerformanceCommand(
                " ", "분야", "현장", "20261022", null, null, null);

        assertThatThrownBy(() -> service.create(command))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).errorType())
                .isEqualTo(ApplicationErrorType.BAD_REQUEST);
        verify(repository, never()).create(any(), any());
    }

    @Test
    void findAllNormalizesSearchConditionsBeforeCallingRepository() {
        var pageable = PageRequest.of(1, 20);
        Page<ServicePerformanceView> result = new PageImpl<>(List.of(), pageable, 0);
        when(repository.findAll(any(), any())).thenReturn(result);

        assertThat(service.findAll(new ServicePerformanceQuery(
                " 검색어 ", " CLIENT ", " 분야 ", " 현장 ", "2026-10-22", " 3 "
        ), pageable)).isEqualTo(result);

        ArgumentCaptor<ServicePerformanceSearch> searchCaptor =
                ArgumentCaptor.forClass(ServicePerformanceSearch.class);
        verify(repository).findAll(searchCaptor.capture(), org.mockito.ArgumentMatchers.same(pageable));
        assertThat(searchCaptor.getValue()).isEqualTo(new ServicePerformanceSearch(
                "검색어", "CLIENT", "분야", "현장", "20261022", "3", "20231022"));
    }

    @Test
    void updateChecksExistenceFromWriteResultWithoutPreloading() {
        ServicePerformanceCommand command = validCommand();
        ServicePerformanceView saved = view(7L);
        when(currentActorPort.currentActor()).thenReturn("admin");
        when(repository.update(any(), any(), any())).thenReturn(1);
        when(repository.findById(7L)).thenReturn(saved);

        assertThat(service.update(7L, command)).isEqualTo(saved);

        verify(repository).update(any(), any(), org.mockito.ArgumentMatchers.eq("admin"));
        verify(repository).findById(7L);
    }

    @Test
    void deleteReportsMissingRowWithoutPreloading() {
        when(repository.delete(7L)).thenReturn(0);

        assertThatThrownBy(() -> service.delete(7L))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.NOT_FOUND));
        verify(repository, never()).findById(any());
    }

    @Test
    void rejectsNonPositiveIdBeforeCallingRepository() {
        assertThatThrownBy(() -> service.findById(0L))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
        verify(repository, never()).findById(any());
    }

    private static ServicePerformanceCommand validCommand() {
        return new ServicePerformanceCommand(
                "CLIENT", "분야", "현장", "20261022",
                BigDecimal.valueOf(1000), BigDecimal.valueOf(95), "비고");
    }

    private static ServicePerformanceView view(Long id) {
        return new ServicePerformanceView(
                id, "CLIENT", "발주처", BigDecimal.valueOf(95), "분야", "현장", "20261022",
                BigDecimal.valueOf(1000), BigDecimal.valueOf(95), "비고",
                null, null, null, null);
    }
}
