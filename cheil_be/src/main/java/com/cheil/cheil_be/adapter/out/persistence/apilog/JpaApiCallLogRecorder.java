package com.cheil.cheil_be.adapter.out.persistence.apilog;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.apilog.port.out.ApiCallLogRecorder;
import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;

/**
 * API 호출 로그를 JPA로 저장하는 출력 어댑터입니다.
 */
@Repository
@RequiredArgsConstructor
public class JpaApiCallLogRecorder implements ApiCallLogRecorder {

    private static final Logger log = LoggerFactory.getLogger(JpaApiCallLogRecorder.class);

    private final ApiCallLogJpaRepository apiCallLogJpaRepository;

    @Override
    public void record(ApiCallLogRecord record) {
        try {
            apiCallLogJpaRepository.save(ApiCallLogEntity.from(record));
        } catch (RuntimeException ex) {
            // 로그 저장 실패가 실제 API 응답 실패로 전파되지 않도록 격리합니다.
            log.warn("Failed to save API call log. requestId={}", record.requestId(), ex);
        }
    }
}
