package com.cheil.cheil_be.application.serviceperformance.port.in;

/** 서비스 실적 목록 조회에 필요한 페이지 번호와 페이지 크기다. Spring Data 타입을 유스케이스 밖으로 숨긴다. */
public record ServicePerformancePageQuery(int page, int size) {

    public ServicePerformancePageQuery {
        if (page < 0) {
            throw new IllegalArgumentException("page must be greater than or equal to 0.");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0.");
        }
    }
}
