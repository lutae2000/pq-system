package com.cheil.cheil_be.adapter.out.persistence.apilog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * API 호출 로그의 복합 검색을 담당하는 QueryDSL 전용 저장소입니다.
 */
public interface ApiCallLogQueryRepository {

    Page<ApiCallLogEntity> search(ApiCallLogSearchCondition condition, Pageable pageable);
}
