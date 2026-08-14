package com.cheil.cheil_be.common.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.config.mail.AppMailProperties;

@Service
@RequiredArgsConstructor
public class MailSendService {

    private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
    private final AppMailProperties mailProperties;

    public boolean send(MailSendRequest request) {
        if (!mailProperties.enabled()) {
            return false;
        }
        if (request == null || !StringUtils.hasText(request.to()) || !StringUtils.hasText(request.subject())) {
            throw new IllegalArgumentException("Mail recipient and subject are required.");
        }

        JavaMailSender mailSender = javaMailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("JavaMailSender is not configured.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (StringUtils.hasText(mailProperties.defaultFrom())) {
            message.setFrom(mailProperties.defaultFrom());
        }
        message.setTo(request.to().trim());
        message.setSubject(request.subject().trim());
        message.setText(request.text() == null ? "" : request.text());
        mailSender.send(message);
        return true;
    }
}
