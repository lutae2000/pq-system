package com.cheil.cheil_be.domain.apilog;

import java.time.Instant;
import java.util.UUID;

/**
 * API 호출 로그 값 객체이다.
 */
public record ApiCallLogRecord(
        UUID requestId,
        String traceId,
        Instant occurredAt,
        String httpMethod,
        String requestUri,
        String queryString,
        String handler,
        String serviceId,
        String loginId,
        String programCode,
        String clientIp,
        String requestPayload,
        String responsePayload,
        Integer statusCode,
        boolean success,
        String errorMessage,
        long durationMillis
) {
}
