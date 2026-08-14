package com.cheil.cheil_be.application.companyperformance.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceSearchCondition;
import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceUpsertCommand;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceAdminService {

    private static final int JOB_NAME_MAX_LENGTH = 500;
    private static final int CONTRACT_DATE_MAX_LENGTH = 8;
    private static final int STOP_DATE_MAX_LENGTH = 10;
    private static final int CODE_MAX_LENGTH = 20;
    private static final int STATUS_CODE_MAX_LENGTH = 1;
    private static final int JOB_RATIO_MAX_LENGTH = 200;
    private static final int ORDER_CLIENT_MAX_LENGTH = 300;
    private static final int AUDIT_ID_MAX_LENGTH = 100;

    private final CompanyPerformanceRepository companyPerformanceRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<CompanyPerformance> findAll(CompanyPerformanceSearchCondition condition, Pageable pageable) {
        return companyPerformanceRepository.findAll(condition, pageable);
    }

    @Transactional(readOnly = true)
    public CompanyPerformance findById(Long seq) {
        if (seq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "seq는 필수입니다.");
        }
        return companyPerformanceRepository.findById(seq)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회사 실적 정보를 찾을 수 없습니다."));
    }

    @Transactional
    public CompanyPerformance create(CompanyPerformanceUpsertCommand command) {
        validateCommand(command);

        Instant now = Instant.now(clock);
        String createdId = StringValues.optional(command.createdId(), "admin");
        String lastChangedId = StringValues.optional(command.lastChangedId(), createdId);

        return companyPerformanceRepository.save(
                toDomain(command, null, now, createdId, now, lastChangedId)
        );
    }

    @Transactional
    public CompanyPerformance update(Long seq, CompanyPerformanceUpsertCommand command) {
        CompanyPerformance existing = findById(seq);
        validateCommand(command);

        Instant now = Instant.now(clock);
        String lastChangedId = StringValues.optional(command.lastChangedId(), existing.createdId());

        return companyPerformanceRepository.save(
                toDomain(command, existing.seq(), existing.createdAt(), existing.createdId(), now, lastChangedId)
        );
    }

    @Transactional
    public void delete(Long seq) {
        findById(seq);
        companyPerformanceRepository.deleteById(seq);
    }

    private void validateCommand(CompanyPerformanceUpsertCommand command) {
        if (command == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문은 필수입니다.");
        }

        StringValues.validateMaxLength(StringValues.normalize(command.jobName()), JOB_NAME_MAX_LENGTH, "jobName");
        StringValues.validateMaxLength(normalizeDateText(command.contractFromDate(), "contractFromDate", CONTRACT_DATE_MAX_LENGTH), CONTRACT_DATE_MAX_LENGTH, "contractFromDate");
        StringValues.validateMaxLength(normalizeDateText(command.contractToDate(), "contractToDate", CONTRACT_DATE_MAX_LENGTH), CONTRACT_DATE_MAX_LENGTH, "contractToDate");
        StringValues.validateMaxLength(normalizeDateText(command.stopDate(), "stopDate", STOP_DATE_MAX_LENGTH), STOP_DATE_MAX_LENGTH, "stopDate");
        StringValues.validateMaxLength(StringValues.normalize(command.jobFinishYn()), STATUS_CODE_MAX_LENGTH, "jobFinishYn");
        StringValues.validateMaxLength(StringValues.normalize(command.jobType()), CODE_MAX_LENGTH, "jobType");
        StringValues.validateMaxLength(StringValues.normalize(command.jobRatio()), JOB_RATIO_MAX_LENGTH, "jobRatio");
        StringValues.validateMaxLength(StringValues.normalize(command.orderClient()), ORDER_CLIENT_MAX_LENGTH, "orderClient");
        StringValues.validateMaxLength(StringValues.normalize(command.clientKind()), CODE_MAX_LENGTH, "clientKind");
        StringValues.validateMaxLength(StringValues.normalize(command.businessType()), CODE_MAX_LENGTH, "businessType");
        StringValues.validateMaxLength(StringValues.optional(command.createdId(), "admin"), AUDIT_ID_MAX_LENGTH, "createdId");
        StringValues.validateMaxLength(
                StringValues.optional(command.lastChangedId(), StringValues.optional(command.createdId(), "admin")),
                AUDIT_ID_MAX_LENGTH,
                "lastChangedId"
        );
    }

    private CompanyPerformance toDomain(
            CompanyPerformanceUpsertCommand command,
            Long seq,
            Instant createdAt,
            String createdId,
            Instant lastChangedAt,
            String lastChangedId
    ) {
        return new CompanyPerformance(
                seq,
                command.jobSeq(),
                StringValues.normalize(command.jobName()),
                toYn(command.jobOwnYn()),
                toYn(command.generalManagementYn()),
                normalizeDateText(command.contractFromDate(), "contractFromDate", CONTRACT_DATE_MAX_LENGTH),
                normalizeDateText(command.contractToDate(), "contractToDate", CONTRACT_DATE_MAX_LENGTH),
                normalizeStatusCode(command.jobFinishYn(), "jobFinishYn"),
                normalizeDateText(command.stopDate(), "stopDate", STOP_DATE_MAX_LENGTH),
                StringValues.normalize(command.summary()),
                StringValues.normalize(command.jobType()),
                StringValues.normalize(command.jobRatio()),
                command.contractAmt(),
                command.ownAmt(),
                StringValues.normalize(command.orderClient()),
                StringValues.normalize(command.remark()),
                command.divisionRate(),
                StringValues.normalize(command.clientKind()),
                StringValues.normalize(command.businessType()),
                toYn(command.overseeYn()),
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }

    private String normalizeDateText(String value, String fieldName, int maxLength) {
        String normalized = StringValues.normalize(value);
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 길이가 올바르지 않습니다.");
        }
        return normalized;
    }

    private String toYn(Boolean value) {
        return Boolean.TRUE.equals(value) ? "Y" : "N";
    }

    private String normalizeStatusCode(String value, String fieldName) {
        String normalized = StringValues.normalize(value);
        if (normalized.isEmpty()) {
            return null;
        }
        // 준공상태는 공통코드 VA의 단일 문자 코드(Y/E/K 등)를 그대로 저장한다.
        if (normalized.length() > STATUS_CODE_MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 길이가 너무 깁니다.");
        }
        return normalized;
    }
}
