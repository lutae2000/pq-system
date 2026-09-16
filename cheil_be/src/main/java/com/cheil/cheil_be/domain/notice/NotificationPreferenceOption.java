package com.cheil.cheil_be.domain.notice;

public record NotificationPreferenceOption(
        String notificationCode,
        String notificationName,
        String description,
        String menuPath,
        boolean receiveYn
) {}
