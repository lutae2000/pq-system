package com.cheil.batch.g2bbidnotice.adapter.out.api;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * 나라장터 Open API 연결 설정입니다.
 * K8S에서는 각 항목에 대응하는 환경변수로 값을 교체할 수 있습니다.
 */
@ConfigurationProperties(prefix = "external-api.g2b")
public record G2bBidNoticeApiProperties(
        String baseUrl,
        String serviceKey,
        Duration connectTimeout,
        Duration readTimeout
) {
    public G2bBidNoticeApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalArgumentException("external-api.g2b.base-url은 필수입니다.");
        }
        if (serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalArgumentException("external-api.g2b.service-key는 필수입니다.");
        }
        connectTimeout = connectTimeout == null ? Duration.ofSeconds(5) : connectTimeout;
        readTimeout = readTimeout == null ? Duration.ofSeconds(30) : readTimeout;
        if (connectTimeout.isZero() || connectTimeout.isNegative()) {
            throw new IllegalArgumentException("external-api.g2b.connect-timeout은 0보다 커야 합니다.");
        }
        if (readTimeout.isZero() || readTimeout.isNegative()) {
            throw new IllegalArgumentException("external-api.g2b.read-timeout은 0보다 커야 합니다.");
        }
    }
}
