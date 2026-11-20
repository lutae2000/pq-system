package com.cheil.cheil_be.application.notice.port.out;

import java.util.List;
import java.util.Map;

import com.cheil.cheil_be.domain.notice.NotificationPreferenceOption;

public interface NotificationPreferenceRepository {
    Map<String, Boolean> findAllByEmployeeNo(String employeeNo);

    List<NotificationPreferenceOption> findOptionsByEmployeeNo(String employeeNo);

    void save(String employeeNo, String menuPath, boolean receiveYn);
}
