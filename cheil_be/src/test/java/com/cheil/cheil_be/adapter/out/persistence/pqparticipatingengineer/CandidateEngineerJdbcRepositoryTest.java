package com.cheil.cheil_be.adapter.out.persistence.pqparticipatingengineer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.SqlArrayValue;

class CandidateEngineerJdbcRepositoryTest {

    @Test
    @SuppressWarnings("unchecked")
    void usesOneParticipationRowForConditionsAndReusesThePredicateForTheCount() {
        JdbcClient jdbcClient = mock(JdbcClient.class);
        var statement = mock(JdbcClient.StatementSpec.class);
        JdbcClient.MappedQuerySpec<CandidateEngineer> candidates = mock(JdbcClient.MappedQuerySpec.class);
        JdbcClient.MappedQuerySpec<Long> count = mock(JdbcClient.MappedQuerySpec.class);
        when(jdbcClient.sql(anyString())).thenReturn(statement);
        when(statement.params(anyMap())).thenReturn(statement);
        when(statement.query(any(RowMapper.class))).thenReturn(candidates);
        when(statement.query(Long.class)).thenReturn(count);
        when(candidates.list()).thenReturn(List.of());
        when(count.single()).thenReturn(0L);

        var filters = new CandidateEngineerFilters(7L, "E100", null, null, null, null, null, null, "N", List.of("D001"));
        var conditions = new ProjectHistoryConditionJsonCodec().parse("""
                [{"conditionType":"constructionKind","level1Code":"A"},
                 {"conditionType":"general","generalCode":"JOIN","value":"Y","logicalOperator":"AND"},
                 {"conditionType":"general","generalCode":"JOB","value":"Road","operator":"LIKE","logicalOperator":"OR"},
                 {"conditionType":"general","generalCode":"JOIN","value":"N","logicalOperator":"AND"}]
                """);
        var metadata = Map.of(
                "JOIN", new ProjectHistoryConditionMetadata("pq_engineer_project_history", "joinyn", "code"),
                "JOB", new ProjectHistoryConditionMetadata("company_performances", "job_name", "text"));

        new CandidateEngineerJdbcRepository(jdbcClient).findCandidates(filters, conditions, metadata, PageRequest.of(0, 10));

        var queries = ArgumentCaptor.forClass(String.class);
        verify(jdbcClient, org.mockito.Mockito.times(2)).sql(queries.capture());
        assertThat(queries.getAllValues()).allSatisfy(sql -> {
            assertThat(sql).containsOnlyOnce("FROM pq_engineer_project_history h")
                    .contains("WHERE h.engr_id = m.engr_id", "k.seq = h.seq", "AND h.joinyn = :historyValue1)", "OR EXISTS", "target.seq = h.seq");
            assertThat(sql).contains("FROM pq_find_engr_info s", "s.bid_seq = :excludeBidSeq",
                    "s.work_duty_id = :excludeWorkDutyId", "m.engr_id <> ALL (:draftEngineerIds)");
            assertThat(sql.replaceAll("\\s+", " "))
                    .contains("LOWER(CAST(target.job_name AS TEXT)) LIKE :historyValue2 ) ) AND h.joinyn = :historyValue3");
        });
        verify(statement, org.mockito.Mockito.times(2)).params(argThat((Map<String, ?> params) ->
                "%road%".equals(params.get("historyValue2")) && params.get("draftEngineerIds") instanceof SqlArrayValue));
    }
}
