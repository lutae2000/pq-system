package com.cheil.cheil_be.adapter.out.persistence.educationreminder;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderAssignedEngineer;
import com.cheil.cheil_be.application.educationreminder.port.out.EducationReminderEngineerAssignmentRepository;
import com.cheil.cheil_be.common.crypto.Aes256CryptoService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class EducationReminderEngineerAssignmentRepositoryAdapter
        implements EducationReminderEngineerAssignmentRepository {

    private final JdbcClient jdbcClient;
    private final Aes256CryptoService aes256CryptoService;

    @Override
    public List<EducationReminderAssignedEngineer> findByBasicInfoCode(String basicInfoCode) {
        return jdbcClient.sql("""
                        SELECT assignment.basic_info_code,
                               assignment.engr_id,
                               COALESCE(engineer.namekor, '') AS engineer_name,
                               COALESCE(engineer.deptname, '') AS department_name,
                               COALESCE(engineer.grade, '') AS grade,
                               COALESCE(engineer.dutypart, '') AS job_field,
                               COALESCE(engineer.propart, '') AS specialty_field,
                               COALESCE(engineer.retireyn, 'N') AS retire_yn,
                               contact.phone_no,
                               assignment.created_at,
                               assignment.created_id,
                               assignment.last_changed_at,
                               assignment.last_changed_id
                        FROM education_reminder_basic_info_engineers assignment
                        LEFT JOIN pq_engineer_master engineer
                          ON engineer.engr_id = assignment.engr_id
                        LEFT JOIN engineer_contacts contact
                          ON contact.engr_id = assignment.engr_id
                        WHERE assignment.basic_info_code = :basicInfoCode
                        ORDER BY engineer.namekor NULLS LAST, assignment.engr_id
                        """)
                .param("basicInfoCode", basicInfoCode)
                .query((resultSet, rowNumber) -> new EducationReminderAssignedEngineer(
                        resultSet.getString("basic_info_code"),
                        resultSet.getString("engr_id"),
                        resultSet.getString("engineer_name"),
                        resultSet.getString("department_name"),
                        resultSet.getString("grade"),
                        resultSet.getString("job_field"),
                        resultSet.getString("specialty_field"),
                        resultSet.getString("retire_yn"),
                        aes256CryptoService.decrypt(resultSet.getString("phone_no")),
                        resultSet.getString("created_at"),
                        resultSet.getString("created_id"),
                        resultSet.getString("last_changed_at"),
                        resultSet.getString("last_changed_id")
                ))
                .list();
    }

    @Override
    public void save(String basicInfoCode, String engineerId, String actor) {
        jdbcClient.sql("""
                        INSERT INTO education_reminder_basic_info_engineers (
                            basic_info_code,
                            engr_id,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :basicInfoCode,
                            :engineerId,
                            :actor,
                            :actor
                        )
                        ON CONFLICT (basic_info_code, engr_id)
                        DO UPDATE SET
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        """)
                .param("basicInfoCode", basicInfoCode)
                .param("engineerId", engineerId)
                .param("actor", actor)
                .update();
    }

    @Override
    public boolean delete(String basicInfoCode, String engineerId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM education_reminder_basic_info_engineers
                        WHERE basic_info_code = :basicInfoCode
                          AND engr_id = :engineerId
                        """)
                .param("basicInfoCode", basicInfoCode)
                .param("engineerId", engineerId)
                .update();
        return deleted == 1;
    }
}
