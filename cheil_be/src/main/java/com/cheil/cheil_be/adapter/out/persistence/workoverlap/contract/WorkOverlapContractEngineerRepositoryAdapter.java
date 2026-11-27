package com.cheil.cheil_be.adapter.out.persistence.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistorySaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerParticipation;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.port.out.WorkOverlapContractEngineerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class WorkOverlapContractEngineerRepositoryAdapter
        implements WorkOverlapContractEngineerRepository {

    private final JdbcClient jdbcClient;

    @Override
    public List<WorkOverlapContractEngineerCandidate> findCandidates(String keyword, int limit) {
        return jdbcClient.sql("""
                        SELECT engr_id,
                               namekor,
                               birthday,
                               COALESCE(dutypart, propart) AS field
                        FROM pq_engineer_master
                        WHERE COALESCE(retireyn, 'N') <> 'Y'
                          AND (:keyword IS NULL
                               OR LOWER(engr_id) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(namekor) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(COALESCE(dutypart, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(COALESCE(propart, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
                        ORDER BY namekor, engr_id
                        LIMIT :limit
                        """)
                .param("keyword", keyword)
                .param("limit", limit)
                .query((resultSet, rowNumber) -> new WorkOverlapContractEngineerCandidate(
                        resultSet.getString("engr_id"),
                        resultSet.getString("namekor"),
                        resultSet.getString("birthday"),
                        resultSet.getString("field")
                ))
                .list();
    }

    @Override
    public List<WorkOverlapContractEngineer> findByContractNo(String contractNo) {
        return jdbcClient.sql("""
                        SELECT selected.engr_id,
                               engineer.namekor,
                               engineer.birthday,
                               COALESCE(selected.field, engineer.dutypart, engineer.propart) AS field,
                               selected.participation_date,
                               selected.participation_end_date,
                               selected.participation_type,
                               selected.pq_target_yn,
                               selected.remark
                        FROM work_overlap_contract_engineers selected
                        LEFT JOIN pq_engineer_master engineer
                          ON engineer.engr_id = selected.engr_id
                        WHERE selected.contract_no = :contractNo
                        ORDER BY selected.participation_date NULLS LAST,
                                 engineer.namekor NULLS LAST,
                                 selected.engr_id
                        """)
                .param("contractNo", contractNo)
                .query((resultSet, rowNumber) -> new WorkOverlapContractEngineer(
                        resultSet.getString("engr_id"),
                        resultSet.getString("namekor"),
                        resultSet.getString("birthday"),
                        resultSet.getString("field"),
                        formatDate(resultSet.getString("participation_date")),
                        formatDate(resultSet.getString("participation_end_date")),
                        resultSet.getString("participation_type"),
                        resultSet.getBoolean("pq_target_yn"),
                        resultSet.getString("remark")
                ))
                .list();
    }

    @Override
    public List<WorkOverlapContractEngineerHistory> findHistoriesByContractNo(String contractNo) {
        return jdbcClient.sql("""
                        SELECT history.id,
                               history.created_at,
                               history.before_engr_id,
                               before_engineer.namekor AS before_engineer_name,
                               history.after_engr_id,
                               after_engineer.namekor AS after_engineer_name,
                               history.before_field,
                               history.before_participation_type,
                               history.before_participation_start_date,
                               history.before_participation_end_date,
                               history.after_field,
                               history.after_participation_type,
                               history.after_participation_start_date,
                               history.after_participation_end_date,
                               history.change_content
                        FROM work_overlap_contract_engineer_histories history
                        LEFT JOIN pq_engineer_master before_engineer
                          ON before_engineer.engr_id = history.before_engr_id
                        LEFT JOIN pq_engineer_master after_engineer
                          ON after_engineer.engr_id = history.after_engr_id
                        WHERE history.contract_no = :contractNo
                        ORDER BY history.created_at DESC, history.id DESC
                        """)
                .param("contractNo", contractNo)
                .query((resultSet, rowNumber) -> {
                    Timestamp createdAt = resultSet.getTimestamp("created_at");
                    return new WorkOverlapContractEngineerHistory(
                            resultSet.getLong("id"),
                            createdAt == null ? null : createdAt.toInstant().toString(),
                            resultSet.getString("before_engr_id"),
                            resultSet.getString("before_engineer_name"),
                            resultSet.getString("after_engr_id"),
                            resultSet.getString("after_engineer_name"),
                            new WorkOverlapContractEngineerParticipation(
                                    resultSet.getString("before_field"),
                                    resultSet.getString("before_participation_type"),
                                    formatDate(resultSet.getString("before_participation_start_date")),
                                    formatDate(resultSet.getString("before_participation_end_date"))
                            ),
                            new WorkOverlapContractEngineerParticipation(
                                    resultSet.getString("after_field"),
                                    resultSet.getString("after_participation_type"),
                                    formatDate(resultSet.getString("after_participation_start_date")),
                                    formatDate(resultSet.getString("after_participation_end_date"))
                            ),
                            resultSet.getString("change_content")
                    );
                })
                .list();
    }

    @Override
    public void create(WorkOverlapContractEngineerSaveCommand command) {
        jdbcClient.sql("""
                        INSERT INTO work_overlap_contract_engineers (
                            contract_no,
                            engr_id,
                            field,
                            participation_date,
                            participation_end_date,
                            participation_type,
                            pq_target_yn,
                            remark,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :contractNo,
                            :engineerId,
                            :field,
                            :participationDate,
                            :participationEndDate,
                            :participationType,
                            :pqTargetYn,
                            :remark,
                            :actor,
                            :actor
                        )
                        """)
                .param("contractNo", command.contractNo())
                .param("engineerId", command.engineerId())
                .param("field", command.field())
                .param("participationDate", command.participationDate())
                .param("participationEndDate", command.participationEndDate())
                .param("participationType", command.participationType())
                .param("pqTargetYn", command.pqTargetYn())
                .param("remark", command.remark())
                .param("actor", command.actor())
                .update();
    }

    @Override
    public boolean update(WorkOverlapContractEngineerSaveCommand command) {
        int updated = jdbcClient.sql("""
                        UPDATE work_overlap_contract_engineers
                        SET engr_id = :engineerId,
                            field = :field,
                            participation_date = :participationDate,
                            participation_end_date = :participationEndDate,
                            participation_type = :participationType,
                            pq_target_yn = :pqTargetYn,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE contract_no = :contractNo
                          AND engr_id = :currentEngineerId
                        """)
                .param("contractNo", command.contractNo())
                .param("currentEngineerId", command.currentEngineerId())
                .param("engineerId", command.engineerId())
                .param("field", command.field())
                .param("participationDate", command.participationDate())
                .param("participationEndDate", command.participationEndDate())
                .param("participationType", command.participationType())
                .param("pqTargetYn", command.pqTargetYn())
                .param("remark", command.remark())
                .param("actor", command.actor())
                .update();
        return updated == 1;
    }

    @Override
    public boolean delete(String contractNo, String engineerId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM work_overlap_contract_engineers
                        WHERE contract_no = :contractNo
                          AND engr_id = :engineerId
                        """)
                .param("contractNo", contractNo)
                .param("engineerId", engineerId)
                .update();
        return deleted == 1;
    }

    @Override
    public boolean deleteHistory(String contractNo, long historyId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM work_overlap_contract_engineer_histories
                        WHERE contract_no = :contractNo
                          AND id = :historyId
                        """)
                .param("contractNo", contractNo)
                .param("historyId", historyId)
                .update();
        return deleted == 1;
    }

    @Override
    public void createHistory(WorkOverlapContractEngineerHistorySaveCommand command) {
        jdbcClient.sql("""
                        INSERT INTO work_overlap_contract_engineer_histories (
                            contract_no,
                            before_engr_id,
                            after_engr_id,
                            change_content,
                            before_field,
                            before_participation_type,
                            before_participation_start_date,
                            before_participation_end_date,
                            after_field,
                            after_participation_type,
                            after_participation_start_date,
                            after_participation_end_date,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :contractNo,
                            :beforeEngineerId,
                            :afterEngineerId,
                            :changeContent,
                            :beforeField,
                            :beforeParticipationType,
                            :beforeParticipationStartDate,
                            :beforeParticipationEndDate,
                            :afterField,
                            :afterParticipationType,
                            :afterParticipationStartDate,
                            :afterParticipationEndDate,
                            :actor,
                            :actor
                        )
                        """)
                .param("contractNo", command.contractNo())
                .param("beforeEngineerId", command.beforeEngineerId())
                .param("afterEngineerId", command.afterEngineerId())
                .param("changeContent", command.changeContent())
                .param("beforeField", command.beforeParticipation().field())
                .param("beforeParticipationType", command.beforeParticipation().participationType())
                .param("beforeParticipationStartDate", command.beforeParticipation().participationStartDate())
                .param("beforeParticipationEndDate", command.beforeParticipation().participationEndDate())
                .param("afterField", command.afterParticipation().field())
                .param("afterParticipationType", command.afterParticipation().participationType())
                .param("afterParticipationStartDate", command.afterParticipation().participationStartDate())
                .param("afterParticipationEndDate", command.afterParticipation().participationEndDate())
                .param("actor", command.actor())
                .update();
    }

    private String formatDate(String value) {
        if (value == null || value.length() != 8) {
            return value;
        }
        return value.substring(0, 4) + "-" + value.substring(4, 6) + "-" + value.substring(6, 8);
    }
}
