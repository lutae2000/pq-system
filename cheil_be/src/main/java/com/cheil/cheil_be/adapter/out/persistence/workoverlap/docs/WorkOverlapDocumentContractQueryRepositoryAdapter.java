package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentContract;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentContractRow;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentContractQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class WorkOverlapDocumentContractQueryRepositoryAdapter
        implements WorkOverlapDocumentContractQueryRepository {

    private final JdbcClient jdbcClient;

    @Override
    public List<WorkOverlapDocumentContractRow> findAvailable(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            int remainingDays
    ) {
        return jdbcClient.sql("""
                        SELECT NULL::BIGINT AS target_id,
                               NULL::INTEGER AS display_order,
                               NULL::VARCHAR AS responsibility,
                               contract.contract_no,
                               contract.service_type,
                               contract.client_name,
                               contract.supervising_department_code,
                               contract.public_contract_yn,
                               contract.service_name,
                               contract.construction_start_date,
                               contract.construction_complete_date,
                               contract.management_service_complete_date,
                               contract.construction_stop_from_date,
                               contract.construction_stop_to_date,
                               contract.restart_date,
                               contract.contract_amount,
                               contract.share_amount,
                               contract.performance_certification,
                               contract.participate_list_document,
                               contract.cems_confirm,
                               contract.remark,
                               contract.created_at,
                               contract.created_id,
                               contract.last_changed_at,
                               contract.last_changed_id,
                               engineer.participation_type,
                               engineer.pq_target_yn,
                               CASE
                                   WHEN contract.construction_complete_date IS NULL THEN NULL
                                   ELSE to_date(contract.construction_complete_date, 'YYYYMMDD')
                                        - to_date(:referenceDate, 'YYYYMMDD') + 1
                               END AS remain_date,
                               CASE
                                   WHEN contract.public_contract_yn = false THEN false
                                   WHEN contract.construction_complete_date IS NULL THEN false
                                   ELSE to_date(contract.construction_complete_date, 'YYYYMMDD')
                                        - to_date(:referenceDate, 'YYYYMMDD') + 1 > :remainingDays
                                        AND contract.service_type = '설계'
                               END AS check_yn
                        FROM work_overlap_contracts contract
                        INNER JOIN work_overlap_contract_engineers engineer
                                ON engineer.contract_no = contract.contract_no
                               AND engineer.engr_id = :engineerId
                        WHERE contract.contract_no NOT IN (
                            SELECT target.contract_no
                            FROM work_overlap_document_targets target
                            WHERE target.bid_seq = :bidSeq
                              AND target.work_duty_id = :workDutyId
                              AND target.engr_id = :engineerId
                        )
                        ORDER BY contract.contract_no
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .param("engineerId", engineerId)
                .param("referenceDate", referenceDate)
                .param("remainingDays", remainingDays)
                .query(this::mapRow)
                .list();
    }

    @Override
    public List<WorkOverlapDocumentContractRow> findSaved(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            int remainingDays
    ) {
        return jdbcClient.sql("""
                        SELECT target.target_id,
                               target.display_order,
                               target.responsibility,
                               contract.contract_no,
                               contract.service_type,
                               contract.client_name,
                               contract.supervising_department_code,
                               contract.public_contract_yn,
                               contract.service_name,
                               contract.construction_start_date,
                               contract.construction_complete_date,
                               contract.management_service_complete_date,
                               contract.construction_stop_from_date,
                               contract.construction_stop_to_date,
                               contract.restart_date,
                               contract.contract_amount,
                               contract.share_amount,
                               contract.performance_certification,
                               contract.participate_list_document,
                               contract.cems_confirm,
                               contract.remark,
                               contract.created_at,
                               contract.created_id,
                               contract.last_changed_at,
                               contract.last_changed_id,
                               NULL::VARCHAR AS participation_type,
                               NULL::BOOLEAN AS pq_target_yn,
                               CASE
                                   WHEN contract.construction_complete_date IS NULL THEN NULL
                                   ELSE to_date(contract.construction_complete_date, 'YYYYMMDD')
                                        - to_date(:referenceDate, 'YYYYMMDD') + 1
                               END AS remain_date,
                               CASE
                                   WHEN contract.public_contract_yn = false THEN false
                                   WHEN contract.construction_complete_date IS NULL THEN false
                                   ELSE to_date(contract.construction_complete_date, 'YYYYMMDD')
                                        - to_date(:referenceDate, 'YYYYMMDD') + 1 > :remainingDays
                                        AND contract.service_type = '설계'
                               END AS check_yn
                        FROM work_overlap_document_targets target
                        LEFT JOIN work_overlap_contracts contract
                          ON target.contract_no = contract.contract_no
                        WHERE target.engr_id = :engineerId
                          AND target.work_duty_id = :workDutyId
                          AND target.bid_seq = :bidSeq
                          AND contract.contract_no IS NOT NULL
                        ORDER BY target.display_order NULLS LAST, target.target_id
                        """)
                .param("engineerId", engineerId)
                .param("workDutyId", workDutyId)
                .param("bidSeq", bidSeq)
                .param("referenceDate", referenceDate)
                .param("remainingDays", remainingDays)
                .query(this::mapRow)
                .list();
    }

    private WorkOverlapDocumentContractRow mapRow(ResultSet resultSet, int rowNumber)
            throws SQLException {
        return new WorkOverlapDocumentContractRow(
                resultSet.getObject("target_id", Long.class),
                resultSet.getObject("display_order", Integer.class),
                resultSet.getString("responsibility"),
                new WorkOverlapDocumentContract(
                        resultSet.getString("contract_no"),
                        resultSet.getString("service_type"),
                        resultSet.getString("client_name"),
                        resultSet.getString("supervising_department_code"),
                        nullableBoolean(resultSet, "public_contract_yn"),
                        resultSet.getString("service_name"),
                        resultSet.getString("construction_start_date"),
                        resultSet.getString("construction_complete_date"),
                        resultSet.getString("management_service_complete_date"),
                        resultSet.getString("construction_stop_from_date"),
                        resultSet.getString("construction_stop_to_date"),
                        resultSet.getString("restart_date"),
                        resultSet.getBigDecimal("contract_amount"),
                        resultSet.getBigDecimal("share_amount"),
                        resultSet.getString("performance_certification"),
                        resultSet.getString("participate_list_document"),
                        resultSet.getString("cems_confirm"),
                        resultSet.getString("remark"),
                        resultSet.getString("created_at"),
                        resultSet.getString("created_id"),
                        resultSet.getString("last_changed_at"),
                        resultSet.getString("last_changed_id"),
                        resultSet.getString("participation_type"),
                        nullableBoolean(resultSet, "pq_target_yn"),
                        nullableInteger(resultSet, "remain_date"),
                        nullableBoolean(resultSet, "check_yn")
                )
        );
    }

    private Boolean nullableBoolean(ResultSet resultSet, String column) throws SQLException {
        boolean value = resultSet.getBoolean(column);
        return resultSet.wasNull() ? null : value;
    }

    private Integer nullableInteger(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }
}
