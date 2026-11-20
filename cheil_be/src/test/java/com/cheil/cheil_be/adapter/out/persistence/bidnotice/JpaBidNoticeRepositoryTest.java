package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.querydsl.jpa.HQLTemplates;
import com.querydsl.jpa.impl.JPAQueryFactory;

class JpaBidNoticeRepositoryTest {

    @Test
    void listAndCountUseTheSameClientAndRemarkContainsFilters() {
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
                null, " Water ", " Urgent ", null, null, null, null, null, null,
                null, null, null, null, null, null, null);

        assertThat(repository.findAll(condition, PageRequest.of(1, 5)).getTotalElements()).isEqualTo(3);

        ArgumentCaptor<String> queries = ArgumentCaptor.forClass(String.class);
        verify(entityManager, times(2)).createQuery(queries.capture());
        assertThat(queries.getAllValues()).allSatisfy(query -> assertThat(query)
                .contains("left join ClientEntity client", "lower(client.orderNameLong) like",
                        "lower(bidNoticeEntity.orderClient) like", "and lower(bidNoticeEntity.remark) like"));
        for (Query query : List.of(listQuery, countQuery)) {
            verify(query).setParameter(1, "%water%");
            verify(query).setParameter(2, "%water%");
            verify(query).setParameter(3, "%urgent%");
        }
    }
}
