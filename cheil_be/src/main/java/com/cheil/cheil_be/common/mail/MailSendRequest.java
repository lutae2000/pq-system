package com.cheil.cheil_be.common.mail;

public record MailSendRequest(
        String to,
        String subject,
        String text
) {
}
