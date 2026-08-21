package com.cheil.cheil_be.adapter.out.persistence.apilog;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;

/**
 * api_call_logs 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "api_call_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class ApiCallLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private UUID requestId;

    @Column(length = 32)
    private String traceId;

    @Column(nullable = false)
    private Instant occurredAt;

    @Column(nullable = false, length = 16)
    private String httpMethod;

    @Column(nullable = false, columnDefinition = "text")
    private String requestUri;

    @Column(columnDefinition = "text")
    private String queryString;

    @Column(columnDefinition = "text")
    private String handler;

    @Column(length = 100)
    private String serviceId;

    @Column(length = 100)
    private String loginId;

    @Column(length = 100)
    private String programCode;

    @Column(length = 64)
    private String clientIp;

    @Column(columnDefinition = "text")
    private String requestPayload;

    @Column(columnDefinition = "text")
    private String responsePayload;

    private Integer statusCode;

    @Column(nullable = false)
    private boolean success;

    @Column(columnDefinition = "text")
    private String errorMessage;

    @Column(nullable = false)
    private long durationMillis;

    static ApiCallLogEntity from(ApiCallLogRecord record) {
        return ApiCallLogEntity.builder()
                .requestId(record.requestId())
                .traceId(record.traceId())
                .occurredAt(record.occurredAt())
                .httpMethod(record.httpMethod())
                .requestUri(record.requestUri())
                .queryString(record.queryString())
                .handler(record.handler())
                .serviceId(record.serviceId())
                .loginId(record.loginId())
                .programCode(record.programCode())
                .clientIp(record.clientIp())
                .requestPayload(record.requestPayload())
                .responsePayload(record.responsePayload())
                .statusCode(record.statusCode())
                .success(record.success())
                .errorMessage(record.errorMessage())
                .durationMillis(record.durationMillis())
                .build();
    }
}
