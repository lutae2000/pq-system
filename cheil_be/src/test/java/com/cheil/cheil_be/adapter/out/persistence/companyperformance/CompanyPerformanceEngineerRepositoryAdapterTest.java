package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;
import java.sql.ResultSet;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;

class CompanyPerformanceEngineerRepositoryAdapterTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
    private final CompanyPerformanceEngineerRepositoryAdapter repository = new CompanyPerformanceEngineerRepositoryAdapter(jdbc);

    @Test
    void bindsSelectedContractPeriodAndJobTagAndUsesTheReturnedId() {
        JdbcClient.MappedQuerySpec<Long> inserted = mock();
        when(jdbc.sql(anyString())).thenReturn(statement);
        when(statement.query(Long.class)).thenReturn(inserted);
        when(inserted.single()).thenReturn(41L);
        var command = new CompanyPerformanceEngineerCommand(
                "ENG-1", null, null, 12L, "CAA", null, null, null, null, null, null, null, null, null, null, null);

        assertThat(repository.create(3L, command)).isEqualTo(41L);
        verify(statement).param("contractPeriodId", 12L);
        verify(statement).param("jobTag", "CAA");
    }

    @Test
    void readsSelectedContractPeriodAndJobTagFromHistory() throws Exception {
        JdbcClient.MappedQuerySpec<CompanyPerformanceEngineerResult> selected = mock();
        var resultSet = mock(ResultSet.class);
        when(jdbc.sql(anyString())).thenReturn(statement);
        when(resultSet.getObject("contract_period_id", Long.class)).thenReturn(12L);
        when(resultSet.getString("jobtag")).thenReturn("CAH");
        when(statement.query(ArgumentMatchers.<RowMapper<CompanyPerformanceEngineerResult>>any())).thenAnswer(invocation -> {
            RowMapper<CompanyPerformanceEngineerResult> mapper = invocation.getArgument(0);
            var row = mapper.mapRow(resultSet, 0);
            when(selected.optional()).thenReturn(Optional.of(row));
            return selected;
        });

        var engineer = repository.findById(3L, 41L);
        assertThat(engineer.contractPeriodId()).isEqualTo(12L);
        assertThat(engineer.jobTag()).isEqualTo("CAH");
    }
}
