package com.cheil.cheil_be.config.educationreminder;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.education-reminder.send")
public record AppEducationReminderSendProperties(
        boolean enabled,
        ChannelProperties lms,
        ChannelProperties sms,
        ChannelProperties kakao
) {
    public ChannelProperties channel(String channel) {
        if (channel == null) {
            return ChannelProperties.disabled();
        }

        return switch (channel.trim().toUpperCase()) {
            case "LMS" -> lms == null ? ChannelProperties.disabled() : lms;
            case "SMS" -> sms == null ? ChannelProperties.disabled() : sms;
            case "KAKAO" -> kakao == null ? ChannelProperties.disabled() : kakao;
            default -> ChannelProperties.disabled();
        };
    }

    public record ChannelProperties(
            boolean enabled,
            boolean simulate,
            String endpointUrl,
            String senderName,
            String apiKey
    ) {
        static ChannelProperties disabled() {
            return new ChannelProperties(false, true, "", "", "");
        }
    }
}
