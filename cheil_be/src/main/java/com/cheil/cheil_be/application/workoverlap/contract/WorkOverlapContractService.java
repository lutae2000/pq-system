package com.cheil.cheil_be.application.workoverlap.contract;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractPeriodHistoryResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractSummaryResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapEngineerContractResponse;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.contract.WorkOverlapContractEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.contract.WorkOverlapContractJpaRepository;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

/** 업무중복도 계약의 본문과 계약별 요약·기간 이력을 조회하고 관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class WorkOverlapContractService {

    private static final int CONTRACT_NO_MAX_LENGTH = 8;
    private static final int SHORT_TEXT_MAX_LENGTH = 100;
    private static final int CLIENT_NAME_MAX_LENGTH = 300;
    private static final int SERVICE_NAME_MAX_LENGTH = 500;
    private static final int STATUS_MAX_LENGTH = 30;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final int PERIOD_CHANGE_REASON_MAX_LENGTH = 500;
    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String PERIOD_HISTORY_CHANGE_CONTENT = "기간정보 변경";

    private final WorkOverlapContractJpaRepository repository;
    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<WorkOverlapContractResponse> findAll(
            String keyword,
            String serviceType,
            String clientName,
            String engineerName,
            String constructionStartDateFrom,
            String constructionStartDateTo,
            String performanceCertification,
            String participateListDocument,
            Boolean cemsConfirm,
            String status,
            String referenceDate,
            Pageable pageable
    ) {
        String normalizedKeyword = keyword(keyword);
        String normalizedServiceType = value(serviceType);
        String normalizedClientName = value(clientName);
        String normalizedEngineerName = value(engineerName);
        String normalizedConstructionStartDateFrom = date(constructionStartDateFrom, "constructionStartDateFrom");
        String normalizedConstructionStartDateTo = date(constructionStartDateTo, "constructionStartDateTo");
        String normalizedPerformanceCertification = value(performanceCertification);
        String normalizedParticipateListDocument = value(participateListDocument);
        Boolean normalizedCemsConfirm = cemsConfirm;
        String normalizedStatus = value(status);
        String normalizedReferenceDate = referenceDate(referenceDate);
        List<String> engineerContractNos = normalizedEngineerName == null ? null : findContractNosByEngineerName(normalizedEngineerName);

        if (engineerContractNos != null && engineerContractNos.isEmpty()) {
            return Page.empty(pageable);
        }

        if (normalizedKeyword == null
                && normalizedServiceType == null
                && normalizedClientName == null
                && normalizedEngineerName == null
                && normalizedConstructionStartDateFrom == null
                && normalizedConstructionStartDateTo == null
                && normalizedPerformanceCertification == null
                && normalizedParticipateListDocument == null
                && normalizedCemsConfirm == null
                && normalizedStatus == null) {
            return repository.findAll(pageable).map(WorkOverlapContractEntity::toResponse);
        }

        return repository.findAll(
                        searchSpec(
                                normalizedKeyword,
                                normalizedServiceType,
                                normalizedClientName,
                                engineerContractNos,
                                normalizedConstructionStartDateFrom,
                                normalizedConstructionStartDateTo,
                                normalizedPerformanceCertification,
                                normalizedParticipateListDocument,
                                normalizedCemsConfirm,
                                normalizedStatus,
                                normalizedReferenceDate
                        ),
                        pageable
                )
                .map(WorkOverlapContractEntity::toResponse);
    }

    @Transactional(readOnly = true)
    public WorkOverlapContractSummaryResponse summary(
            String keyword,
            String serviceType,
            String clientName,
            String engineerName,
            String constructionStartDateFrom,
            String constructionStartDateTo,
            String performanceCertification,
            String participateListDocument,
            Boolean cemsConfirm,
            String status,
            String referenceDate
    ) {
        String normalizedKeyword = keyword(keyword);
        String normalizedServiceType = value(serviceType);
        String normalizedClientName = value(clientName);
        String normalizedEngineerName = value(engineerName);
        String normalizedConstructionStartDateFrom = date(constructionStartDateFrom, "constructionStartDateFrom");
        String normalizedConstructionStartDateTo = date(constructionStartDateTo, "constructionStartDateTo");
        String normalizedPerformanceCertification = value(performanceCertification);
        String normalizedParticipateListDocument = value(participateListDocument);
        Boolean normalizedCemsConfirm = cemsConfirm;
        String normalizedStatus = value(status);
        String normalizedReferenceDate = referenceDate(referenceDate);
        List<String> engineerContractNos = normalizedEngineerName == null ? null : findContractNosByEngineerName(normalizedEngineerName);

        List<WorkOverlapContractEntity> entities = engineerContractNos != null && engineerContractNos.isEmpty()
                ? List.of()
                : normalizedKeyword == null
                && normalizedServiceType == null
                && normalizedClientName == null
                && normalizedEngineerName == null
                && normalizedConstructionStartDateFrom == null
                && normalizedConstructionStartDateTo == null
                && normalizedPerformanceCertification == null
                && normalizedParticipateListDocument == null
                && normalizedCemsConfirm == null
                && normalizedStatus == null
                ? repository.findAll()
                : repository.findAll(
                        searchSpec(
                                normalizedKeyword,
                                normalizedServiceType,
                                normalizedClientName,
                                engineerContractNos,
                                normalizedConstructionStartDateFrom,
                                normalizedConstructionStartDateTo,
                                normalizedPerformanceCertification,
                                normalizedParticipateListDocument,
                                normalizedCemsConfirm,
                                normalizedStatus,
                                normalizedReferenceDate
                        )
                );

        long progressCount = 0L;
        long completedCount = 0L;
        long stoppedCount = 0L;
        long processedCount = 0L;
        long unprocessedCount = 0L;
        BigDecimal contractAmount = BigDecimal.ZERO;

        for (WorkOverlapContractEntity entity : entities) {
            boolean stopped = isBetweenDates(normalizedReferenceDate, entity.getConstructionStopFromDate(), entity.getConstructionStopToDate());
            boolean completed = entity.getConstructionCompleteDate() != null && normalizedReferenceDate.compareTo(entity.getConstructionCompleteDate()) > 0;
            boolean processed =
                    isReceiptTrue(entity.getPerformanceCertification())
                            && isReceiptTrue(entity.getParticipateListDocument())
                            && isReceiptTrue(entity.getCemsConfirm());

            if (stopped) {
                stoppedCount++;
            } else if (completed) {
                completedCount++;
            } else {
                progressCount++;
            }

            if (processed) {
                processedCount++;
            } else {
                unprocessedCount++;
            }

            if (entity.getContractAmount() != null) {
                contractAmount = contractAmount.add(entity.getContractAmount());
            }
        }

        return new WorkOverlapContractSummaryResponse(
                progressCount,
                completedCount,
                stoppedCount,
                processedCount,
                unprocessedCount,
                entities.size(),
                contractAmount
        );
    }

    @Transactional(readOnly = true)
    public Page<WorkOverlapEngineerContractResponse> findEngineerContracts(
            String engineerId,
            String referenceDate,
            String remainingDays,
            boolean excludeCompleted,
            Pageable pageable
    ) {
        String normalizedEngineerId = value(engineerId);
        if (normalizedEngineerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "engineerId is required.");
        }
        String normalizedReferenceDate = referenceDate(referenceDate);
        Integer normalizedRemainingDays = positiveInteger(remainingDays, "remainingDays");

        long totalElements = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM work_overlap_contracts c
                        WHERE (
                                EXISTS (
                                    SELECT 1
                                    FROM work_overlap_contract_engineers e
                                    WHERE e.contract_no = c.contract_no
                                      AND e.engineer_id = :engineerId
                                )
                                OR EXISTS (
                                    SELECT 1
                                    FROM work_overlap_contract_engineer_histories h
                                    WHERE h.contract_no = c.contract_no
                                      AND (h.before_engineer_id = :engineerId OR h.after_engineer_id = :engineerId)
                                )
                          )
                          AND (
                                :excludeCompleted = FALSE
                                OR NULLIF(TRIM(c.construction_complete_date), '') IS NULL
                                OR c.construction_complete_date >= :referenceDate
                          )
                        """)
                .param("engineerId", normalizedEngineerId)
                .param("excludeCompleted", excludeCompleted)
                .param("referenceDate", normalizedReferenceDate)
                .query(Long.class)
                .single();

        if (totalElements == 0L) {
            return Page.empty(pageable);
        }

        int limit = pageable.getPageSize();
        int offset = Math.toIntExact(pageable.getOffset());

        List<WorkOverlapEngineerContractResponse> rows = jdbcClient.sql("""
                        SELECT
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
                            h.before_engineer_id,
                            h.after_engineer_id,
                            (h.id IS NOT NULL) AS engineer_history_yn,
                            CASE
                                WHEN c.construction_complete_date IS NULL THEN NULL
                                ELSE to_date(c.construction_complete_date, 'YYYYMMDD') - to_date(:referenceDate, 'YYYYMMDD') + 1
                            END AS remain_date,
                            CASE
                                WHEN c.public_contract_yn = false THEN false
                                WHEN c.construction_complete_date IS NULL THEN false
                                ELSE to_date(c.construction_complete_date, 'YYYYMMDD') - to_date(:referenceDate, 'YYYYMMDD') +1 > :remainingDays AND c.service_type = '설계'
                            END AS check_yn
                        FROM work_overlap_contracts c
                        LEFT JOIN work_overlap_contract_engineers e
                               ON e.contract_no = c.contract_no
                              AND e.engineer_id = :engineerId
                        LEFT JOIN LATERAL (
                            SELECT history.id, history.before_engineer_id, history.after_engineer_id
                            FROM work_overlap_contract_engineer_histories history
                            WHERE history.contract_no = c.contract_no
                              AND (history.before_engineer_id = :engineerId OR history.after_engineer_id = :engineerId)
                            ORDER BY history.created_at DESC, history.id DESC
                            LIMIT 1
                        ) h ON TRUE
                        WHERE (e.engineer_id IS NOT NULL OR h.id IS NOT NULL)
                          AND (
                                :excludeCompleted = FALSE
                                OR NULLIF(TRIM(c.construction_complete_date), '') IS NULL
                                OR c.construction_complete_date >= :referenceDate
                          )
                        ORDER BY c.contract_no
                        LIMIT :limit OFFSET :offset
                        """)
                .param("engineerId", normalizedEngineerId)
                .param("excludeCompleted", excludeCompleted)
                .param("referenceDate", normalizedReferenceDate)
                .param("remainingDays", normalizedRemainingDays)
                .param("limit", limit)
                .param("offset", offset)
                .query((rs, rowNum) -> new WorkOverlapEngineerContractResponse(
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
                        booleanValue(rs, "pq_target_yn"),
                        integerValue(rs, "remain_date"),
                        booleanValue(rs, "check_yn"),
                        rs.getString("before_engineer_id"),
                        rs.getString("after_engineer_id"),
                        booleanValue(rs, "engineer_history_yn")
                ))
                .list();

        return new PageImpl<>(rows, pageable, totalElements);
    }

    @Transactional(readOnly = true)
    public WorkOverlapContractResponse findByContractNo(String contractNo) {
        return findEntity(contractNo).toResponse();
    }

    @Transactional
    public WorkOverlapContractResponse create(WorkOverlapContractRequest request) {
        WorkOverlapContractEntity saved = repository.save(new WorkOverlapContractEntity(generateContractNo(), normalize(request)));
        return saved.toResponse();
    }

    @Transactional
    public WorkOverlapContractResponse update(String contractNo, WorkOverlapContractRequest request) {
        WorkOverlapContractEntity entity = findEntity(contractNo);
        WorkOverlapContractRequest normalized = normalize(request);
        String periodChangeReason = limitedText(normalized.periodChangeReason(), PERIOD_CHANGE_REASON_MAX_LENGTH, "periodChangeReason");
        List<PeriodHistoryEntry> historyEntries = collectPeriodHistoryEntries(entity, normalized, periodChangeReason);
        entity.update(normalized);
        insertPeriodHistories(entity.getContractNo(), historyEntries, periodChangeReason);
        return entity.toResponse();
    }

    @Transactional
    public void delete(String contractNo) {
        repository.delete(findEntity(contractNo));
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractPeriodHistoryResponse> findPeriodHistoriesByContractNo(String contractNo) {
        String normalizedContractNo = value(contractNo);
        if (normalizedContractNo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contractNo is required.");
        }
        findEntity(normalizedContractNo);
        return jdbcClient.sql("""
                        SELECT
                            id,
                            created_at,
                            period_name,
                            before_value,
                            after_value,
                            change_content,
                            change_reason
                        FROM work_overlap_contract_period_histories
                        WHERE contract_no = :contractNo
                        ORDER BY created_at DESC, id DESC
                        """)
                .param("contractNo", normalizedContractNo)
                .query((rs, rowNum) -> new WorkOverlapContractPeriodHistoryResponse(
                        rs.getLong("id"),
                        rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant().toString(),
                        rs.getString("period_name"),
                        rs.getString("before_value"),
                        rs.getString("after_value"),
                        rs.getString("change_content"),
                        rs.getString("change_reason")
                ))
                .list();
    }

    @Transactional
    public void deletePeriodHistory(String contractNo, long historyId) {
        String normalizedContractNo = value(contractNo);
        if (normalizedContractNo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contractNo is required.");
        }
        findEntity(normalizedContractNo);
        int deleted = jdbcClient.sql("""
                        DELETE FROM work_overlap_contract_period_histories
                        WHERE contract_no = :contractNo
                          AND id = :historyId
                        """)
                .param("contractNo", normalizedContractNo)
                .param("historyId", historyId)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기간정보 변경이력을 찾을 수 없습니다.");
        }
    }

    private WorkOverlapContractEntity findEntity(String contractNo) {
        String normalizedContractNo = value(contractNo);
        if (normalizedContractNo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contractNo is required.");
        }
        return repository.findById(normalizedContractNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "?낅Т以묐났??怨꾩빟 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎."));
    }

    private WorkOverlapContractRequest normalize(WorkOverlapContractRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        return new WorkOverlapContractRequest(
                limitedText(request.serviceType(), SHORT_TEXT_MAX_LENGTH, "serviceType"),
                limitedText(request.clientName(), CLIENT_NAME_MAX_LENGTH, "clientName"),
                limitedText(request.supervisingDepartmentCode(), SHORT_TEXT_MAX_LENGTH, "supervisingDepartmentCode"),
                request.publicContractYn(),
                requiredText(request.serviceName(), SERVICE_NAME_MAX_LENGTH, "serviceName"),
                date(request.constructionStartDate(), "constructionStartDate"),
                date(request.constructionCompleteDate(), "constructionCompleteDate"),
                date(request.managementServiceCompleteDate(), "managementServiceCompleteDate"),
                date(request.constructionStopFromDate(), "constructionStopFromDate"),
                date(request.constructionStopToDate(), "constructionStopToDate"),
                date(request.restartDate(), "restartDate"),
                nonNegative(request.contractAmount(), "contractAmount"),
                nonNegative(request.shareAmount(), "shareAmount"),
                limitedText(request.performanceCertification(), STATUS_MAX_LENGTH, "performanceCertification"),
                limitedText(request.participateListDocument(), STATUS_MAX_LENGTH, "participateListDocument"),
                limitedText(request.cemsConfirm(), STATUS_MAX_LENGTH, "cemsConfirm"),
                limitedText(request.remark(), REMARK_MAX_LENGTH, "remark"),
                limitedText(request.periodChangeReason(), PERIOD_CHANGE_REASON_MAX_LENGTH, "periodChangeReason")
        );
    }

    private String generateContractNo() {
        long nextValue = repository.nextContractNoSequenceValue();
        String contractNo = String.format(Locale.ROOT, "C%07d", nextValue);
        StringValues.validateMaxLength(contractNo, CONTRACT_NO_MAX_LENGTH, "contractNo");
        return contractNo;
    }

    private Specification<WorkOverlapContractEntity> searchSpec(
            String keyword,
            String serviceType,
            String clientName,
            List<String> engineerContractNos,
            String constructionStartDateFrom,
            String constructionStartDateTo,
            String performanceCertification,
            String participateListDocument,
            Boolean cemsConfirm,
            String status,
            String referenceDate
    ) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();

            if (keyword != null) {
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("contractNo")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("serviceType"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("clientName"), "")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("remark"), "")), keyword)
                        )
                );
            }
            if (serviceType != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("serviceType"), "%" + serviceType + "%"));
            }
            if (clientName != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("clientName"), "%" + clientName + "%"));
            }
            if (engineerContractNos != null) {
                predicate = criteriaBuilder.and(predicate, root.get("contractNo").in(engineerContractNos));
            }
            if (constructionStartDateFrom != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("constructionStartDate"), constructionStartDateFrom));
            }
            if (constructionStartDateTo != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("constructionStartDate"), constructionStartDateTo));
            }
            if (performanceCertification != null) {
                predicate = criteriaBuilder.and(predicate, receiptPredicate(criteriaBuilder, root.get("performanceCertification"), performanceCertification));
            }
            if (participateListDocument != null) {
                predicate = criteriaBuilder.and(predicate, receiptPredicate(criteriaBuilder, root.get("participateListDocument"), participateListDocument));
            }
            if (cemsConfirm != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("cemsConfirm"), cemsConfirm.toString()));
            }
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, statusPredicate(criteriaBuilder, root, status, referenceDate));
            }

            return predicate;
        };
    }

    private List<String> findContractNosByEngineerName(String engineerName) {
        return jdbcClient.sql("""
                        SELECT DISTINCT e.contract_no
                        FROM work_overlap_contract_engineers e
                        LEFT JOIN pq_engineer_master m ON m.engr_id = e.engineer_id
                        WHERE LOWER(e.engineer_id) LIKE LOWER(CONCAT('%', :engineerName, '%'))
                           OR LOWER(COALESCE(m.namekor, '')) LIKE LOWER(CONCAT('%', :engineerName, '%'))
                        ORDER BY e.contract_no
                        """)
                .param("engineerName", engineerName)
                .query(String.class)
                .list();
    }

    private jakarta.persistence.criteria.Predicate statusPredicate(
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            jakarta.persistence.criteria.Root<WorkOverlapContractEntity> root,
            String status,
            String referenceDate
    ) {
        jakarta.persistence.criteria.Expression<String> stopFrom = root.get("constructionStopFromDate").as(String.class);
        jakarta.persistence.criteria.Expression<String> stopTo = root.get("constructionStopToDate").as(String.class);
        jakarta.persistence.criteria.Expression<String> completeDate = root.get("constructionCompleteDate").as(String.class);

        jakarta.persistence.criteria.Predicate stopped = criteriaBuilder.and(
                criteriaBuilder.isNotNull(stopFrom),
                criteriaBuilder.isNotNull(stopTo),
                criteriaBuilder.lessThanOrEqualTo(stopFrom, referenceDate),
                criteriaBuilder.greaterThanOrEqualTo(stopTo, referenceDate)
        );
        jakarta.persistence.criteria.Predicate completed = criteriaBuilder.and(
                criteriaBuilder.isNotNull(completeDate),
                criteriaBuilder.lessThan(completeDate, referenceDate)
        );
        jakarta.persistence.criteria.Predicate progress = criteriaBuilder.and(
                criteriaBuilder.not(stopped),
                criteriaBuilder.not(completed)
        );

        return switch (status) {
            case "stopped" -> stopped;
            case "completed" -> completed;
            case "progress" -> progress;
            default -> criteriaBuilder.conjunction();
        };
    }

    private jakarta.persistence.criteria.Predicate receiptPredicate(
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            jakarta.persistence.criteria.Path<String> path,
            String value
    ) {
        return switch (value) {
            case "true", "수령" -> criteriaBuilder.or(
                    criteriaBuilder.equal(path, "true"),
                    criteriaBuilder.equal(path, "수령")
            );
            case "false", "미수령" -> criteriaBuilder.or(
                    criteriaBuilder.equal(path, "false"),
                    criteriaBuilder.equal(path, "미수령")
            );
            default -> criteriaBuilder.equal(path, value);
        };
    }

    private String requiredText(String value, int maxLength, String fieldName) {
        String normalized = StringValues.required(value, fieldName).trim();
        StringValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    private String limitedText(String value, int maxLength, String fieldName) {
        String normalized = value(value);
        StringValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    private String keyword(String value) {
        String normalized = value(value);
        return normalized == null ? null : "%" + normalized.toLowerCase(Locale.ROOT) + "%";
    }

    private String value(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String date(String value, String fieldName) {
        String normalized = value(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        return compact;
    }

    private String normalizeDate(String value) {
        String normalized = value(value);
        return normalized == null ? null : normalized.replaceAll("\\D", "");
    }

    private String referenceDate(String value) {
        String normalized = value(value);
        if (normalized == null) {
            return LocalDate.now().format(BASIC_DATE_FORMATTER);
        }
        return date(normalized, "referenceDate");
    }

    private boolean isBetweenDates(String targetKey, String fromKey, String toKey) {
        if (targetKey == null) {
            return false;
        }
        if (fromKey != null && targetKey.compareTo(fromKey) < 0) {
            return false;
        }
        if (toKey != null && targetKey.compareTo(toKey) > 0) {
            return false;
        }
        return fromKey != null || toKey != null;
    }

    private boolean isReceiptTrue(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim();
        return "true".equalsIgnoreCase(normalized) || "수령".equals(normalized);
    }

    private Boolean booleanValue(java.sql.ResultSet rs, String columnLabel) {
        try {
            boolean value = rs.getBoolean(columnLabel);
            return rs.wasNull() ? null : value;
        } catch (java.sql.SQLException exception) {
            throw new IllegalStateException("Failed to read boolean column: " + columnLabel, exception);
        }
    }

    private Integer integerValue(java.sql.ResultSet rs, String columnLabel) {
        try {
            int value = rs.getInt(columnLabel);
            return rs.wasNull() ? null : value;
        } catch (java.sql.SQLException exception) {
            throw new IllegalStateException("Failed to read integer column: " + columnLabel, exception);
        }
    }

    private LocalDate parseDate(String value) {
        String normalized = value(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            return null;
        }
        return LocalDate.parse(compact, BASIC_DATE_FORMATTER);
    }

    private List<PeriodHistoryEntry> collectPeriodHistoryEntries(
            WorkOverlapContractEntity entity,
            WorkOverlapContractRequest request,
            String periodChangeReason
    ) {
        List<PeriodHistoryEntry> entries = new ArrayList<>();
        addPeriodHistoryEntry(entries, "공사시작일", entity.getConstructionStartDate(), request.constructionStartDate());
        addPeriodHistoryEntry(entries, "공사준공일", entity.getConstructionCompleteDate(), request.constructionCompleteDate());
        addPeriodHistoryEntry(entries, "관리용역 준공일", entity.getManagementServiceCompleteDate(), request.managementServiceCompleteDate());
        addPeriodHistoryEntry(entries, "중지 시작일", entity.getConstructionStopFromDate(), request.constructionStopFromDate());
        addPeriodHistoryEntry(entries, "중지 종료일", entity.getConstructionStopToDate(), request.constructionStopToDate());
        addPeriodHistoryEntry(entries, "재개일", entity.getRestartDate(), request.restartDate());
        if (!entries.isEmpty() && !StringUtils.hasText(periodChangeReason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기간 정보 변경 사유를 입력해 주세요.");
        }
        return entries;
    }

    private void addPeriodHistoryEntry(
            List<PeriodHistoryEntry> entries,
            String periodName,
            String beforeValue,
            String afterValue
    ) {
        String normalizedBefore = normalizeDate(beforeValue);
        String normalizedAfter = normalizeDate(afterValue);
        if (Objects.equals(normalizedBefore, normalizedAfter)) {
            return;
        }
        entries.add(new PeriodHistoryEntry(periodName, normalizedBefore, normalizedAfter));
    }

    private void insertPeriodHistories(String contractNo, List<PeriodHistoryEntry> entries, String periodChangeReason) {
        if (entries.isEmpty()) {
            return;
        }
        String actor = AuditActorResolver.resolve();
        for (PeriodHistoryEntry entry : entries) {
            jdbcClient.sql("""
                            INSERT INTO work_overlap_contract_period_histories (
                                contract_no,
                                period_name,
                                before_value,
                                after_value,
                                change_content,
                                change_reason,
                                created_id,
                                last_changed_id
                            )
                            VALUES (
                                :contractNo,
                                :periodName,
                                :beforeValue,
                                :afterValue,
                                :changeContent,
                                :changeReason,
                                :actor,
                                :actor
                            )
                            """)
                    .param("contractNo", contractNo)
                    .param("periodName", entry.periodName())
                    .param("beforeValue", entry.beforeValue())
                    .param("afterValue", entry.afterValue())
                    .param("changeContent", PERIOD_HISTORY_CHANGE_CONTENT)
                    .param("changeReason", periodChangeReason)
                    .param("actor", actor)
                    .update();
        }
    }

    private Integer positiveInteger(String value, String fieldName) {
        String normalized = value(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        if (!normalized.matches("\\d+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be a positive integer.");
        }
        int parsed = Integer.parseInt(normalized);
        if (parsed <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than 0.");
        }
        return parsed;
    }

    private BigDecimal nonNegative(BigDecimal value, String fieldName) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
        }
        return value;
    }

    private record PeriodHistoryEntry(String periodName, String beforeValue, String afterValue) {
    }
}
