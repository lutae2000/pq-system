package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.simple.JdbcClient;

class CompanyPerformanceDocumentTargetRepositoryAdapterTest {
    @Test
    void savesOnlyTheCurrentEmployeesTargetsAndKeepsExistingTargetIds() {
        var jdbc = mock(JdbcClient.class);
        var statement = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
        when(jdbc.sql(anyString())).thenReturn(statement);
        var repository = new CompanyPerformanceDocumentTargetRepositoryAdapter(jdbc);

        repository.save(12L, "E01", List.of(new CompanyPerformanceDocumentTarget(91L, 12L, 31L, 2)));

        var sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).sql(sql.capture());
        assertThat(sql.getValue()).contains("ON CONFLICT (bid_seq, employee_no)", "SET company_targets = EXCLUDED.company_targets")
                .doesNotContain("conditions_json");
        verify(statement).param("bidSeq", 12L);
        verify(statement).param("employeeNo", "E01");
        var json = ArgumentCaptor.forClass(String.class);
        verify(statement).param(org.mockito.ArgumentMatchers.eq("targets"), json.capture());
        assertThat(json.getValue()).contains("\"targetId\":91", "\"companyPerformanceSeq\":31", "\"displayOrder\":2");
        verify(statement).update();
    }
}
