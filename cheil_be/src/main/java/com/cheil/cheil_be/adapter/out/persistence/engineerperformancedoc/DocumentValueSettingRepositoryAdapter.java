package com.cheil.cheil_be.adapter.out.persistence.engineerperformancedoc;

import java.sql.Timestamp;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.engineerperformancedoc.model.DocumentValueSetting;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.SaveDocumentValueSettingCommand;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.DocumentValueSettingRepository;

/** 문서 값 설정의 SQL과 JDBC 행 매핑을 담당하는 출력 adapter다. */
@Repository
@RequiredArgsConstructor
public class DocumentValueSettingRepositoryAdapter implements DocumentValueSettingRepository {

    private final JdbcClient jdbcClient;

    @Override
    public List<DocumentValueSetting> findByBidSeq(Long bidSeq) {
        return jdbcClient.sql("""
                        SELECT bid_seq, engr_id, selected_education_id, selected_license_id,
                               created_at, created_id, last_changed_at, last_changed_id
                        FROM pq_engineer_document_value_settings
                        WHERE bid_seq = :bidSeq
                        ORDER BY engr_id
                        """)
                .param("bidSeq", bidSeq)
                .query((rs, rowNum) -> map(rs))
                .list();
    }

    @Override
    public boolean existsEducation(Long educationId, String engineerId) {
        return exists("pq_engineer_school", educationId, engineerId);
    }

    @Override
    public boolean existsLicense(Long licenseId, String engineerId) {
        return exists("pq_engineer_license", licenseId, engineerId);
    }

    private boolean exists(String tableName, Long detailId, String engineerId) {
        // 테이블명은 외부 입력이 아니라 위 두 메서드에서만 고정값으로 전달된다.
        return jdbcClient.sql("SELECT COUNT(*) > 0 FROM " + tableName + " WHERE id = :detailId AND engr_id = :engineerId")
                .params(java.util.Map.of("detailId", detailId, "engineerId", engineerId))
                .query(Boolean.class)
                .single();
    }

    @Override
    public DocumentValueSetting save(SaveDocumentValueSettingCommand command, String actor) {
        jdbcClient.sql("""
                        INSERT INTO pq_engineer_document_value_settings
                            (bid_seq, engr_id, selected_education_id, selected_license_id, created_id, last_changed_id)
                        VALUES (:bidSeq, :engineerId, :educationId, :licenseId, :actor, :actor)
                        ON CONFLICT (bid_seq, engr_id) DO UPDATE SET
                            selected_education_id = EXCLUDED.selected_education_id,
                            selected_license_id = EXCLUDED.selected_license_id,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        """)
                // 선택하지 않은 학력·자격 값은 null일 수 있으므로 Map.of 대신 개별 파라미터를 사용한다.
                .param("bidSeq", command.bidSeq())
                .param("engineerId", command.engineerId())
                .param("educationId", command.educationId())
                .param("licenseId", command.licenseId())
                .param("actor", actor)
                .update();

        return jdbcClient.sql("""
                        SELECT bid_seq, engr_id, selected_education_id, selected_license_id,
                               created_at, created_id, last_changed_at, last_changed_id
                        FROM pq_engineer_document_value_settings
                        WHERE bid_seq = :bidSeq AND engr_id = :engineerId
                        """)
                .params(java.util.Map.of("bidSeq", command.bidSeq(), "engineerId", command.engineerId()))
                .query((rs, rowNum) -> map(rs))
                .single();
    }

    private DocumentValueSetting map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new DocumentValueSetting(
                rs.getLong("bid_seq"),
                rs.getString("engr_id"),
                rs.getObject("selected_education_id", Long.class),
                rs.getObject("selected_license_id", Long.class),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id"));
    }

    private java.time.Instant toInstant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
