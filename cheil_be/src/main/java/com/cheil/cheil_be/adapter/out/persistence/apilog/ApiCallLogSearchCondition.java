package com.cheil.cheil_be.adapter.out.persistence.apilog;

import java.time.Instant;

/**
 * QueryDSL 조회 조건을 담는 단순 검색 조건 객체입니다.
 */
public record ApiCallLogSearchCondition(
        String serviceId,
        Boolean success,
        Instant occurredFrom,
        Instant occurredTo
) {
}
