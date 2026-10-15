package com.cheil.cheil_be.config.batch;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.batch")
public record AppBatchProperties(String url, String apiKey) {
}
