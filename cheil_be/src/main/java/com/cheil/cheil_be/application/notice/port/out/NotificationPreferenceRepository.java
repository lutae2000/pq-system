package com.cheil.cheil_be.application.notice.port.out;

import java.util.List;
import java.util.Map;

import com.cheil.cheil_be.domain.notice.NotificationPreferenceOption;

public interface NotificationPreferenceRepository {
    Map<String, Boolean> findAllByLoginId(String loginId);

    List<NotificationPreferenceOption> findOptionsByLoginId(String loginId);

    void save(String loginId, String menuPath, boolean receiveYn);
}
