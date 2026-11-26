package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.adapter.out.persistence.engineerperformancedoc.EngineerProjectHistoryJdbcRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceContractDatesRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.BidSelectionLock;
import com.cheil.cheil_be.domain.companyperformance.ContractPeriodDates;
import java.sql.ResultSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentMatchers;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;

class EngineerPerformanceDocumentParticipationTest {
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void returnsOverallAndPhaseContractDatesForParticipationRatio(boolean reviewResults) throws Exception {
        var jdbcClient = mock(JdbcClient.class);
        var statement = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
        var repository = mock(CompanyPerformanceContractDatesRepository.class);
        var service = new EngineerPerformanceDocumentService(jdbcClient,
                new EngineerProjectHistoryJdbcRepository(jdbcClient), () -> "tester", mock(BidSelectionLock.class),
                mock(ProjectHistoryConditionMetadataService.class), new ProjectHistoryConditionJsonCodec(), repository);
        var selected = mock(ResultSet.class);
        var unselected = mock(ResultSet.class);
        when(selected.getInt("source_seq")).thenReturn(11);
        when(selected.getInt("seq")).thenReturn(100);
        when(selected.getString("contract_from_date")).thenReturn("20240101");
        when(selected.getString("contract_to_date")).thenReturn("20241231");
        when(unselected.getInt("source_seq")).thenReturn(12);
        when(unselected.getInt("seq")).thenReturn(200);
        var contractPeriods = List.of(
                new ContractPeriodDates("20240101", "20240201"),
                new ContractPeriodDates("20240301", "20240401"));
        when(repository.findContractDatesByPerformanceSeqs(List.of(100L, 200L))).thenReturn(Map.of(100L, contractPeriods));
        when(jdbcClient.sql(anyString())).thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<Object>>any()))
                .thenAnswer(invocation -> {
                    RowMapper<Object> mapper = invocation.getArgument(0);
                    List<Object> rows = List.of(mapper.mapRow(selected, 0), mapper.mapRow(unselected, 1));
                    JdbcClient.MappedQuerySpec<Object> query = mock();
                    when(query.list()).thenReturn(rows);
                    return query;
                });
        var rows = reviewResults ? service.findReviewResults(7L, "E001", null) : service.findProjectHistories("E001", null);

        assertThat(rows).hasSize(2);
        assertThat(rows.getFirst().contractFromDate()).isEqualTo("20240101");
        assertThat(rows.getFirst().contractToDate()).isEqualTo("20241231");
        assertThat(rows.getFirst().contractPeriods()).isEqualTo(contractPeriods);
        assertThat(rows.getLast().contractFromDate()).isNull();
        assertThat(rows.getLast().contractToDate()).isNull();
        assertThat(rows.getLast().contractPeriods()).isEmpty();
    }
}
