package com.cheil.cheil_be.config.systempolicy;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.system-policy-cache")
public record AppSystemPolicyCacheProperties(Duration ttl) {

    public AppSystemPolicyCacheProperties {
        ttl = ttl == null ? Duration.ofMinutes(10) : ttl;
    }
}
