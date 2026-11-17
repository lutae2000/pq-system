package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;

class CompanyPerformanceDocumentTargetRepositoryAdapterTest {
    @Test
    void mapsSavedTargetsWithoutExposingJpaEntity() {
        var jpa = mock(CompanyPerformanceDocumentTargetJpaRepository.class);
        when(jpa.findByBidSeqOrderByTargetId(12L)).thenReturn(List.of(
                new CompanyPerformanceDocumentTargetEntity(12L, 31L, 2),
                new CompanyPerformanceDocumentTargetEntity(12L, 32L, null)));

        var targets = new CompanyPerformanceDocumentTargetRepositoryAdapter(jpa).findByBidSeq(12L);

        assertEquals(List.of(31L, 32L), targets.stream().map(target -> target.companyPerformanceSeq()).toList());
        assertEquals(2, targets.get(0).displayOrder());
        assertEquals(null, targets.get(1).displayOrder());
    }
}
