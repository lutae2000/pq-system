package com.cheil.cheil_be.adapter.out.persistence.apilog;

import static com.cheil.cheil_be.adapter.out.persistence.apilog.QApiCallLogEntity.apiCallLogEntity;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

/**
 * QueryDSL로 api_call_logs 를 검색하는 구현체입니다.
 */
@Repository
@RequiredArgsConstructor
public class ApiCallLogQueryRepositoryImpl implements ApiCallLogQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<ApiCallLogEntity> search(ApiCallLogSearchCondition condition, Pageable pageable) {
        BooleanBuilder predicate = new BooleanBuilder();

        if (condition != null) {
            if (StringUtils.hasText(condition.serviceId())) {
                predicate.and(apiCallLogEntity.serviceId.eq(condition.serviceId()));
            }
            if (condition.success() != null) {
                predicate.and(apiCallLogEntity.success.eq(condition.success()));
            }
            if (condition.occurredFrom() != null) {
                predicate.and(apiCallLogEntity.occurredAt.goe(condition.occurredFrom()));
            }
            if (condition.occurredTo() != null) {
                predicate.and(apiCallLogEntity.occurredAt.loe(condition.occurredTo()));
            }
        }

        List<ApiCallLogEntity> content = queryFactory
                .selectFrom(apiCallLogEntity)
                .where(predicate)
                .orderBy(apiCallLogEntity.occurredAt.desc(), apiCallLogEntity.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return PageableExecutionUtils.getPage(
                content,
                pageable,
                () -> queryFactory.select(apiCallLogEntity.count())
                        .from(apiCallLogEntity)
                        .where(predicate)
                        .fetchOne()
        );
    }
}
