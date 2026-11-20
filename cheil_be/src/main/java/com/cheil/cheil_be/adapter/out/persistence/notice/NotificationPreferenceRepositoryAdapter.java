package com.cheil.cheil_be.adapter.out.persistence.notice;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.notice.port.out.NotificationPreferenceRepository;
import com.cheil.cheil_be.domain.notice.NotificationPreferenceOption;

@Repository
@RequiredArgsConstructor
public class NotificationPreferenceRepositoryAdapter implements NotificationPreferenceRepository {
    private final JdbcClient jdbcClient;

    @Override
    public Map<String, Boolean> findAllByEmployeeNo(String employeeNo) {
        return jdbcClient.sql("SELECT menu_path, receive_yn FROM notification_preferences WHERE employee_no = :employeeNo")
                .param("employeeNo", employeeNo)
                .query((rs, rowNum) -> Map.entry(rs.getString("menu_path"), rs.getBoolean("receive_yn")))
                .list().stream().collect(LinkedHashMap::new, (map, entry) -> map.put(entry.getKey(), entry.getValue()), Map::putAll);
    }

    @Override
    public List<NotificationPreferenceOption> findOptionsByEmployeeNo(String employeeNo) {
        return jdbcClient.sql("""
                SELECT topic.notification_code, topic.notification_name, topic.description, topic.menu_path,
                       COALESCE(preference.receive_yn, FALSE) AS receive_yn
                FROM notification_topics topic
                LEFT JOIN notification_preferences preference
                  ON preference.employee_no = :employeeNo
                 AND preference.menu_path = topic.menu_path
                WHERE topic.use_yn = TRUE
                ORDER BY topic.sort_seq, topic.notification_name
                """)
                .param("employeeNo", employeeNo)
                .query((rs, rowNum) -> new NotificationPreferenceOption(
                        rs.getString("notification_code"),
                        rs.getString("notification_name"),
                        rs.getString("description"),
                        rs.getString("menu_path"),
                        rs.getBoolean("receive_yn")
                ))
                .list();
    }

    @Override
    public void save(String employeeNo, String menuPath, boolean receiveYn) {
        jdbcClient.sql("""
                INSERT INTO notification_preferences (employee_no, menu_path, receive_yn)
                VALUES (:employeeNo, :menuPath, :receiveYn)
                ON CONFLICT (employee_no, menu_path) DO UPDATE SET receive_yn = EXCLUDED.receive_yn, last_changed_at = CURRENT_TIMESTAMP
                """)
                .param("employeeNo", employeeNo)
                .param("menuPath", menuPath)
                .param("receiveYn", receiveYn)
                .update();
    }
}
