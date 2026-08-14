package com.cheil.cheil_be.config.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record AppMailProperties(
        boolean enabled,
        String defaultFrom
) {
}
