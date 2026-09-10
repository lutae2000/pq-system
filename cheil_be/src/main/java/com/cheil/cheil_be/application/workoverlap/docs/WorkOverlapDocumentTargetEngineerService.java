package com.cheil.cheil_be.application.workoverlap.docs;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetEngineerItem;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentEngineerUpdateRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetEngineerResponse;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerJpaRepository;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerService {
    private final WorkOverlapDocumentTargetEngineerJpaRepository repository;
    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<WorkOverlapDocumentTargetEngineerResponse> find(Long bidSeq, String workDutyId, String keyword) {
        validateKey(bidSeq, workDutyId, null);
        String normalizedKeyword = normalize(keyword);
        return jdbcClient.sql("""
                        SELECT s.target_id,
                               s.bid_seq,
                               s.work_duty_id,
                               s.engr_id,
                               CASE LOWER(COALESCE(s.responsibility, ''))
                                   WHEN '사업책임' THEN 1
                                   WHEN '책임' THEN 2
                                   WHEN '참여' THEN 3
                                   WHEN '실무' THEN 4
                                   ELSE 5
                               END AS responsibility_order,
                               s.display_order,
                               s.responsibility,
                               m.namekor,
                               m.birthday,
                               m.deptname,
                               m.grade,
                               m.dutypart,
                               m.propart,
                               m.retireyn
                        FROM work_overlap_document_engineers s
                        LEFT JOIN pq_engineer_master m ON m.engr_id = s.engr_id
                        WHERE s.bid_seq = :bidSeq
                          AND s.work_duty_id = :workDutyId
                          AND (CAST(:keyword AS VARCHAR) IS NULL
                               OR LOWER(s.engr_id) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%'))
                               OR LOWER(COALESCE(m.namekor, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%')))
                        ORDER BY responsibility_order,
                                 CASE WHEN s.display_order IS NULL THEN 1 ELSE 0 END,
                                 s.display_order NULLS LAST,
                                 m.namekor NULLS LAST,
                                 s.engr_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId.trim())
                .param("keyword", normalizedKeyword)
                .query((rs, rowNum) -> new WorkOverlapDocumentTargetEngineerResponse(
                        rs.getLong("target_id"), rs.getLong("bid_seq"), rs.getString("work_duty_id"),
                        rs.getString("engr_id"), getInteger(rs, "display_order"), rs.getString("responsibility"),
                        rs.getString("namekor"), rs.getString("birthday"), rs.getString("deptname"),
                        rs.getString("grade"), rs.getString("dutypart"), rs.getString("propart"), rs.getString("retireyn")
                ))
                .list();
    }

    @Transactional
    public List<WorkOverlapDocumentTargetEngineerResponse> replace(WorkOverlapDocumentTargetEngineerRequest request) {
        validateKey(request == null ? null : request.bidSeq(), request == null ? null : request.workDutyId(), null);
        String workDutyId = request.workDutyId().trim();
        Map<String, WorkOverlapDocumentTargetEngineerItem> requested = new LinkedHashMap<>();
        (request.engineers() == null ? List.<WorkOverlapDocumentTargetEngineerItem>of() : request.engineers())
                .stream()
                .filter(item -> item != null && item.engrId() != null && !item.engrId().isBlank())
                .forEach(item -> requested.put(item.engrId().trim(), item));

        List<WorkOverlapDocumentTargetEngineerEntity> existing = repository.findByWorkDutyIdAndBidSeqOrderByDisplayOrderAscTargetIdAsc(workDutyId, request.bidSeq());
        existing.stream()
                .filter(row -> !requested.containsKey(row.getEngrId()))
                .forEach(row -> repository.deleteByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), row.getEngrId()));

        List<WorkOverlapDocumentTargetEngineerEntity> next = requested.entrySet().stream().map(entry -> {
            WorkOverlapDocumentTargetEngineerItem item = entry.getValue();
            WorkOverlapDocumentTargetEngineerEntity row = repository.findByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), entry.getKey());
            if (row == null) {
                return new WorkOverlapDocumentTargetEngineerEntity(request.bidSeq(), workDutyId, entry.getKey(), item.displayOrder(), normalize(item.responsibility()));
            }
            row.update(item.displayOrder(), normalize(item.responsibility()));
            return row;
        }).toList();
        repository.saveAll(next);
        return find(request.bidSeq(), workDutyId, null);
    }

    @Transactional
    public void delete(Long bidSeq, String workDutyId, String engrId) {
        validateKey(bidSeq, workDutyId, engrId);
        repository.deleteByWorkDutyIdAndBidSeqAndEngrId(workDutyId.trim(), bidSeq, engrId.trim());
    }

    @Transactional
    public void update(WorkOverlapDocumentEngineerUpdateRequest request) {
        validateKey(request == null ? null : request.bidSeq(), request == null ? null : request.workDutyId(), request == null ? null : request.engrId());
        String workDutyId = request.workDutyId().trim();
        String engrId = request.engrId().trim();
        WorkOverlapDocumentTargetEngineerEntity row = repository.findByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), engrId);
        if (row == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Selected engineer was not found.");
        }
        row.update(request.displayOrder(), normalize(request.responsibility()));
        repository.save(row);
    }

    private void validateKey(Long bidSeq, String workDutyId, String engineerId) {
        if (bidSeq == null || workDutyId == null || workDutyId.isBlank() || (engineerId != null && engineerId.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq and workDutyId are required.");
        }
    }

    private String normalize(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private Integer getInteger(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }
}
