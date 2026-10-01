package com.cheil.cheil_be.application.serviceperformance.port.in;

import java.util.List;

/** 서비스 실적 목록의 데이터와 페이지 메타데이터를 담는 애플리케이션 결과다. */
public record ServicePerformancePage(
        List<ServicePerformanceView> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
