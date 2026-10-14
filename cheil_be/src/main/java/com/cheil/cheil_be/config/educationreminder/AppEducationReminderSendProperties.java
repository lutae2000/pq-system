package com.cheil.cheil_be.config.educationreminder;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.education-reminder.send")
public record AppEducationReminderSendProperties(
        boolean enabled,
        MunjaNaraProperties munjanara
) {
    public record MunjaNaraProperties(
            boolean enabled,
            String endpointUrl,
            String userId,
            String secondPassword,
            String senderNumber,
            String adminNumber,
            String messageCharset
    ) {
        static MunjaNaraProperties disabled() {
            return new MunjaNaraProperties(false, "", "", "", "", "", "UTF-8");
        }
    }
}
