package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.ParticipationContractPeriodRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;
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
    void attachesTheParticipationPeriodToEachHistoryWithoutChangingOverallContractDates(boolean reviewResults) throws Exception {
        var jdbcClient = mock(JdbcClient.class);
        var statement = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
        var periods = mock(ParticipationContractPeriodRepository.class);
        var service = new EngineerPerformanceDocumentService(jdbcClient,
                mock(ProjectHistoryConditionMetadataService.class), new ProjectHistoryConditionJsonCodec(), periods);
        var selected = mock(ResultSet.class);
        var unselected = mock(ResultSet.class);
        when(selected.getInt("source_seq")).thenReturn(11);
        when(selected.getString("contract_from_date")).thenReturn("20240101");
        when(selected.getString("contract_to_date")).thenReturn("20241231");
        when(unselected.getInt("source_seq")).thenReturn(12);
        when(jdbcClient.sql(anyString())).thenReturn(statement);
        when(statement.query(ArgumentMatchers.<RowMapper<EngineerProjectHistoryReviewResponse>>any()))
                .thenAnswer(invocation -> {
                    RowMapper<EngineerProjectHistoryReviewResponse> mapper = invocation.getArgument(0);
                    List<EngineerProjectHistoryReviewResponse> rows = List.of(mapper.mapRow(selected, 0), mapper.mapRow(unselected, 1));
                    JdbcClient.MappedQuerySpec<EngineerProjectHistoryReviewResponse> query = mock();
                    when(query.list()).thenReturn(rows);
                    return query;
                });
        var period = new ParticipationContractPeriod("20240301", "20240630");
        when(periods.findByProjectHistoryIds(List.of(11L, 12L))).thenReturn(Map.of(11L, period));

        var rows = reviewResults ? service.findReviewResults(7L, "E001", null) : service.findProjectHistories("E001", null);

        assertThat(rows).hasSize(2);
        assertThat(rows.getFirst().participationContractPeriod()).isEqualTo(period);
        assertThat(rows.getFirst().contractFromDate()).isEqualTo("20240101");
        assertThat(rows.getFirst().contractToDate()).isEqualTo("20241231");
        assertThat(rows.getLast().participationContractPeriod()).isNull();
    }
}
