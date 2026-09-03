package com.cheil.cheil_be.config.jpa;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.completed-query-logging")
public record AppCompletedQueryLoggingProperties(List<String> excludedSqlPatterns) {

    public AppCompletedQueryLoggingProperties {
        excludedSqlPatterns = excludedSqlPatterns == null ? List.of() : List.copyOf(excludedSqlPatterns);
    }
}
