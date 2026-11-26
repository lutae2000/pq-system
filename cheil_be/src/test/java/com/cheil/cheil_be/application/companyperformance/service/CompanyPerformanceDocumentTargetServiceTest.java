package com.cheil.cheil_be.application.companyperformance.service;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.BidSelectionLock;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CompanyPerformanceDocumentTargetServiceTest {
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void replacesTheEmployeesTargetsWithExactlyTheMatchedPerformances(boolean hasMatches) {
        var targets = mock(CompanyPerformanceDocumentTargetRepository.class);
        var query = mock(CompanyPerformanceDocumentTargetQueryRepository.class);
        var lock = mock(BidSelectionLock.class);
        var service = new CompanyPerformanceDocumentTargetService(
                targets, mock(CompanyPerformanceRepository.class), query, lock, () -> Optional.of("E01"));
        var conditions = List.of(new ProjectHistoryCondition(
                "constructionKind", "AND", null, "도로", "A", "", "", "", "", "", "=", "", "", "code"));
        when(query.findMatchingPerformanceSeqs(conditions)).thenReturn(hasMatches ? List.of(34L, 21L) : List.of());

        service.replaceByConditions(12L, conditions);

        var writes = inOrder(query, lock, targets);
        writes.verify(query).findMatchingPerformanceSeqs(conditions);
        writes.verify(lock).lock(12L);
        writes.verify(targets).save(12L, "E01", hasMatches ? List.of(
                new CompanyPerformanceDocumentTarget(null, 12L, 34L, 1),
                new CompanyPerformanceDocumentTarget(null, 12L, 21L, 2)) : List.of());
        writes.verifyNoMoreInteractions();
    }
}
