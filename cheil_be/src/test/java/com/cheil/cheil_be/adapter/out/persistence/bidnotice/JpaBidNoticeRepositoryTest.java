package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.querydsl.jpa.HQLTemplates;
import com.querydsl.jpa.impl.JPAQueryFactory;

class JpaBidNoticeRepositoryTest {

    @Test
    void calendarLimitsAllScheduleTypesToParticipatingNoticesAndLoadsTheInstitutionName() {
        EntityManager entityManager = mock(EntityManager.class);
        var query = mock(org.hibernate.query.Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.unwrap(org.hibernate.query.Query.class)).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());
        var repository = new JpaBidNoticeRepository(mock(BidNoticeJpaRepository.class), entityManager,
                new JPAQueryFactory(HQLTemplates.DEFAULT, entityManager));

        repository.findAllByCalendarDateBetween(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), "100906");

        ArgumentCaptor<String> queryText = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createQuery(queryText.capture());
        assertThat(queryText.getValue()).contains("select bidNoticeEntity, client.orderNameLong",
                "left join ClientEntity client", "client.clientCode = bidNoticeEntity.orderClient",
                "where bidNoticeEntity.participateYn = ?1 and (bidNoticeEntity.pqSubmitDate",
                "or bidNoticeEntity.interviewDate", ") and bidNoticeEntity.departmentCode =");
        verify(query).setParameter(1, "Y");
    }

    @Test
    void defaultsToAscendingPqSubmissionDateBeforePaging() {
        EntityManager entityManager = mock(EntityManager.class);
        var query = mock(org.hibernate.query.Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.unwrap(org.hibernate.query.Query.class)).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());
        var repository = new JpaBidNoticeRepository(mock(BidNoticeJpaRepository.class), entityManager,
                new JPAQueryFactory(HQLTemplates.DEFAULT, entityManager));

        repository.findAll(null, PageRequest.of(0, 5));

        ArgumentCaptor<String> queryText = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createQuery(queryText.capture());
        assertThat(queryText.getValue())
                .contains("order by case when length(trim(bidNoticeEntity.pqSubmitDate)) = 12",
                        "pg_input_is_valid", "end asc nulls last, bidNoticeEntity.bidSeq desc");
        verify(query).setMaxResults(5);
    }

    @ParameterizedTest
    @EnumSource(Sort.Direction.class)
    void explicitPqDateSortKeepsInvalidDatesLastInBothDirections(Sort.Direction direction) {
        EntityManager entityManager = mock(EntityManager.class);
        var query = mock(org.hibernate.query.Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.unwrap(org.hibernate.query.Query.class)).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());
        var repository = new JpaBidNoticeRepository(mock(BidNoticeJpaRepository.class), entityManager,
                new JPAQueryFactory(HQLTemplates.DEFAULT, entityManager));

        repository.findAll(null, PageRequest.of(0, 5, Sort.by(direction, "pqSubmitDate")));

        var queryText = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createQuery(queryText.capture());
        assertThat(queryText.getValue()).contains("pg_input_is_valid",
                direction.isAscending() ? "end asc nulls last" : "end desc nulls last");
    }

    @Test
    void listAndCountUseTheSameFiltersAndListSortsBeforePaging() {
        EntityManager entityManager = mock(EntityManager.class);
        var listQuery = mock(org.hibernate.query.Query.class);
        var countQuery = mock(org.hibernate.query.Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(listQuery, countQuery);
        when(listQuery.unwrap(org.hibernate.query.Query.class)).thenReturn(listQuery);
        when(countQuery.unwrap(org.hibernate.query.Query.class)).thenReturn(countQuery);
        when(listQuery.getResultList()).thenReturn(List.of());
        when(countQuery.getSingleResult()).thenReturn(3L);
        var repository = new JpaBidNoticeRepository(mock(BidNoticeJpaRepository.class), entityManager,
                new JPAQueryFactory(HQLTemplates.DEFAULT, entityManager));
        var condition = new BidNoticeSearchCondition(
                null, " Water ", " FAK ", " Urgent ", null, null, null, "CAA", null, null,
                null, null, null, null, null, null, null, List.of(" Y ", "", "N", "Y"));

        var pageable = PageRequest.of(1, 5, Sort.by(Sort.Order.asc("pqSubmitDate"), Sort.Order.desc("unknown")));
        assertThat(repository.findAll(condition, pageable).getTotalElements()).isEqualTo(3);

        ArgumentCaptor<String> queries = ArgumentCaptor.forClass(String.class);
        verify(entityManager, times(2)).createQuery(queries.capture());
        assertThat(queries.getAllValues()).allSatisfy(query -> assertThat(query)
                .contains("left join ClientEntity client", "lower(client.orderNameLong) like",
                        "lower(bidNoticeEntity.orderClient) like", "and lower(bidNoticeEntity.remark) like",
                        "and bidNoticeEntity.orderMethod =", "and bidNoticeEntity.businessType =",
                        "and bidNoticeEntity.participateYn in"));
        assertThat(queries.getAllValues().getFirst())
                .contains("order by case when length(trim(bidNoticeEntity.pqSubmitDate)) = 12",
                        "end asc nulls last, bidNoticeEntity.bidSeq desc")
                .doesNotContain("unknown");
        assertThat(queries.getAllValues().getLast()).doesNotContain("order by");
        verify(listQuery).setFirstResult(5);
        for (Query query : List.of(listQuery, countQuery)) {
            verify(query).setParameter(1, "%water%");
            verify(query).setParameter(2, "%water%");
            verify(query).setParameter(3, "%urgent%");
            verify(query).setParameter(4, "FAK");
            verify(query).setParameter(5, "CAA");
            verify(query).setParameter(6, List.of("Y", "N"));
        }
    }
}
