package com.cheil.cheil_be.config.commoncode;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.common-code-cache")
public record AppCommonCodeCacheProperties(
        Duration ttl,
        Duration readTimeout
) {

    public AppCommonCodeCacheProperties {
        ttl = ttl == null ? Duration.ofDays(1) : ttl;
        readTimeout = readTimeout == null ? Duration.ofSeconds(1) : readTimeout;
    }
}
