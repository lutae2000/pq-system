package com.cheil.cheil_be.common.web;

import java.time.Instant;

/**
 * API 실패 응답의 표준 바디입니다.
 * <p>
 * 에러 발생 시점, HTTP 상태, 에러명, 메시지, 요청 경로를 공통 포맷으로 전달합니다.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
