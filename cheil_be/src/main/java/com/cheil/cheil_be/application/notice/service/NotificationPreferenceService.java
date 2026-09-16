package com.cheil.cheil_be.application.notice.service;

import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.notice.port.out.NotificationPreferenceRepository;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.notice.NotificationPreferenceOption;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final CurrentActorPort currentActorPort;

    @Transactional(readOnly = true)
    public Map<String, Boolean> findAll() {
        String loginId = currentActorPort.currentActor();
        return notificationPreferenceRepository.findAllByLoginId(loginId);
    }

    @Transactional(readOnly = true)
    public List<NotificationPreferenceOption> findOptions() {
        String loginId = currentActorPort.currentActor();
        return notificationPreferenceRepository.findOptionsByLoginId(loginId);
    }

    @Transactional
    public void save(String menuPath, Boolean receiveYn) {
        String normalizedPath = StringValues.required(menuPath, "menuPath");
        String loginId = currentActorPort.currentActor();
        notificationPreferenceRepository.save(loginId, normalizedPath, Boolean.TRUE.equals(receiveYn));
    }
}
