package com.cheil.cheil_be.application.workoverlap.docs;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapEngineerContractResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentEngineerContractsResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentSavedContractResponse;
import com.cheil.cheil_be.common.web.PageResponse;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentContractsQueryService {

    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public WorkOverlapDocumentEngineerContractsResponse findContracts(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            String remainingDays,
            Pageable pageable
    ) {
        String normalizedEngineerId = required(engineerId, "engineerId");
        String normalizedWorkDutyId = required(workDutyId, "workDutyId");
        if (bidSeq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq is required.");
        }
        String normalizedReferenceDate = normalizeReferenceDate(referenceDate);
        int normalizedRemainingDays = positiveInteger(remainingDays, "remainingDays");

        List<DocumentContractRow> allRows = jdbcClient.sql("""
                        SELECT
                            t.target_id,
                            t.display_order,
                            t.responsibility,
                            c.contract_no,
                            c.service_type,
                            c.client_name,
                            c.supervising_department_code,
                            c.public_contract_yn,
                            c.service_name,
                            c.construction_start_date,
                            c.construction_complete_date,
                            c.management_service_complete_date,
                            c.construction_stop_from_date,
                            c.construction_stop_to_date,
                            c.restart_date,
                            c.contract_amount,
                            c.share_amount,
                            c.performance_certification,
                            c.participate_list_document,
                            c.cems_confirm,
                            c.remark,
                            c.created_at,
                            c.created_id,
                            c.last_changed_at,
                            c.last_changed_id,
                            e.participation_type,
                            e.pq_target_yn,
                            CASE
                                WHEN c.construction_complete_date IS NULL THEN NULL
                                ELSE to_date(c.construction_complete_date, 'YYYYMMDD') - to_date(:referenceDate, 'YYYYMMDD') + 1
                            END AS remain_date,
                            CASE
                                WHEN c.public_contract_yn = false THEN false
                                WHEN c.construction_complete_date IS NULL THEN false
                                ELSE to_date(c.construction_complete_date, 'YYYYMMDD') - to_date(:referenceDate, 'YYYYMMDD') + 1 > :remainingDays AND c.service_type = '설계'
                            END AS check_yn
                        FROM work_overlap_contracts c
                        INNER JOIN work_overlap_contract_engineers e
                                ON e.contract_no = c.contract_no
                        LEFT JOIN work_overlap_document_targets t
                               ON t.bid_seq = :bidSeq
                              AND t.work_duty_id = :workDutyId
                              AND t.engr_id = :engineerId
                              AND t.contract_no = c.contract_no
                        WHERE e.engr_id = :engineerId
                        ORDER BY c.contract_no
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", normalizedWorkDutyId)
                .param("engineerId", normalizedEngineerId)
                .param("referenceDate", normalizedReferenceDate)
                .param("remainingDays", normalizedRemainingDays)
                .query((rs, rowNum) -> new DocumentContractRow(
                        rs.getObject("target_id", Long.class),
                        rs.getObject("display_order", Integer.class),
                        rs.getString("responsibility"),
                        new WorkOverlapEngineerContractResponse(
                                rs.getString("contract_no"),
                                rs.getString("service_type"),
                                rs.getString("client_name"),
                                rs.getString("supervising_department_code"),
                                rs.getBoolean("public_contract_yn"),
                                rs.getString("service_name"),
                                rs.getString("construction_start_date"),
                                rs.getString("construction_complete_date"),
                                rs.getString("management_service_complete_date"),
                                rs.getString("construction_stop_from_date"),
                                rs.getString("construction_stop_to_date"),
                                rs.getString("restart_date"),
                                rs.getBigDecimal("contract_amount"),
                                rs.getBigDecimal("share_amount"),
                                rs.getString("performance_certification"),
                                rs.getString("participate_list_document"),
                                rs.getString("cems_confirm"),
                                rs.getString("remark"),
                                rs.getString("created_at"),
                                rs.getString("created_id"),
                                rs.getString("last_changed_at"),
                                rs.getString("last_changed_id"),
                                rs.getString("participation_type"),
                                nullableBoolean(rs, "pq_target_yn"),
                                nullableInteger(rs, "remain_date"),
                                nullableBoolean(rs, "check_yn"),
                                null,
                                null,
                                false
                        )
                ))
                .list();

        List<DocumentContractRow> availableRows = allRows.stream().filter(row -> row.targetId() == null).toList();
        List<WorkOverlapEngineerContractResponse> pageRows = availableRows.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .map(DocumentContractRow::contract)
                .toList();
        PageResponse<WorkOverlapEngineerContractResponse> availableContracts = PageResponse.from(
                new PageImpl<>(pageRows, pageable, availableRows.size())
        );
        List<WorkOverlapDocumentSavedContractResponse> savedContracts = allRows.stream()
                .filter(row -> row.targetId() != null)
                .sorted(Comparator.comparing(DocumentContractRow::displayOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(DocumentContractRow::targetId))
                .map(row -> new WorkOverlapDocumentSavedContractResponse(
                        row.targetId(), row.displayOrder(), row.responsibility(), row.contract()))
                .toList();

        return new WorkOverlapDocumentEngineerContractsResponse(availableContracts, savedContracts);
    }

    private String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        return value.trim();
    }

    private String normalizeReferenceDate(String value) {
        String normalized = value == null || value.isBlank()
                ? LocalDate.now().format(BASIC_DATE_FORMATTER)
                : value.trim().replace("-", "");
        if (!normalized.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "referenceDate must be YYYYMMDD.");
        }
        return normalized;
    }

    private int positiveInteger(String value, String fieldName) {
        if (value == null || !value.matches("\\d+") || Integer.parseInt(value) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be a positive integer.");
        }
        return Integer.parseInt(value);
    }

    private Boolean nullableBoolean(java.sql.ResultSet rs, String columnLabel) throws java.sql.SQLException {
        boolean value = rs.getBoolean(columnLabel);
        return rs.wasNull() ? null : value;
    }

    private Integer nullableInteger(java.sql.ResultSet rs, String columnLabel) throws java.sql.SQLException {
        int value = rs.getInt(columnLabel);
        return rs.wasNull() ? null : value;
    }

    private record DocumentContractRow(
            Long targetId,
            Integer displayOrder,
            String responsibility,
            WorkOverlapEngineerContractResponse contract
    ) {
    }
}
