package com.cheil.cheil_be.config.commondepartment;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.department-cache")
public record AppDepartmentCacheProperties(
        Duration ttl,
        Duration readTimeout
) {

    public AppDepartmentCacheProperties {
        ttl = ttl == null ? Duration.ofDays(1) : ttl;
        readTimeout = readTimeout == null ? Duration.ofSeconds(1) : readTimeout;
    }
}
