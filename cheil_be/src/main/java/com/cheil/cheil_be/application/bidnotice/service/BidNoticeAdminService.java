package com.cheil.cheil_be.application.bidnotice.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeUpsertCommand;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Service
@RequiredArgsConstructor
public class BidNoticeAdminService {

    private static final int CODE_MAX_LENGTH = 50;
    private static final int PROJECT_NAME_MAX_LENGTH = 500;
    private static final int ORDER_CLIENT_MAX_LENGTH = 300;
    private static final int PRIME_CONTRACTOR_MAX_LENGTH = 300;
    private static final int REMARK_MAX_LENGTH = 2000;
    private static final int AUDIT_ID_MAX_LENGTH = 100;

    private final BidNoticeRepository bidNoticeRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<BidNotice> findAll(BidNoticeSearchCondition condition, Pageable pageable) {
        return bidNoticeRepository.findAll(condition, pageable);
    }

    @Transactional(readOnly = true)
    public BidNotice findByBidSeq(Long bidSeq) {
        return bidNoticeRepository.findByBidSeq(requiredBidSeq(bidSeq))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고문을 찾을 수 없습니다."));
    }

    @Transactional
    public BidNotice create(BidNoticeUpsertCommand command) {
        NormalizedBidNotice normalized = normalize(command, null);
        if (normalized.bidSeq() != null && bidNoticeRepository.existsByBidSeq(normalized.bidSeq())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 공고문 번호입니다.");
        }

        Instant now = Instant.now(clock);
        return bidNoticeRepository.save(toDomain(normalized, now, normalized.createdId(), now, normalized.lastChangedId()));
    }

    @Transactional
    public BidNotice update(Long bidSeq, BidNoticeUpsertCommand command) {
        BidNotice existing = findByBidSeq(bidSeq);
        NormalizedBidNotice normalized = normalize(command, existing);
        if (!bidSeq.equals(normalized.bidSeq())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고문 번호는 수정할 수 없습니다.");
        }

        Instant now = Instant.now(clock);
        return bidNoticeRepository.save(toDomain(normalized, existing.createdAt(), existing.createdId(), now, normalized.lastChangedId()));
    }

    @Transactional
    public void delete(Long bidSeq) {
        findByBidSeq(bidSeq);
        bidNoticeRepository.deleteByBidSeq(requiredBidSeq(bidSeq));
    }

    private NormalizedBidNotice normalize(BidNoticeUpsertCommand command, BidNotice existing) {
        if (command == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고문 요청 본문이 필요합니다.");
        }

        String projectName = StringValues.required(command.projectName(), "projectName");
        String createdId = StringValues.optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = StringValues.optional(command.lastChangedId(), createdId);
        Long bidSeq = existing == null ? command.bidSeq() : existing.bidSeq();

        NormalizedBidNotice normalized = new NormalizedBidNotice(
                bidSeq,
                StringValues.normalize(command.departmentCode()),
                projectName,
                StringValues.normalize(command.orderClient()),
                command.designAmt(),
                StringValues.normalize(command.bidType()),
                StringValues.normalize(command.bidMethod()),
                command.announceDate(),
                command.pqRegistDate(),
                command.pqSubmitDate(),
                StringValues.normalize(command.orderMethod()),
                command.bidDate(),
                command.interviewDate(),
                StringValues.normalize(command.bidSuccessYn()),
                StringValues.normalize(command.pqDecideEmpno()),
                command.pqDecideDate(),
                StringValues.normalize(command.superDecideEmpno()),
                normalizeYn(command.participateYn()),
                StringValues.normalize(command.businessType()),
                command.bidSubmissionDate(),
                StringValues.normalize(command.processTag()),
                command.bidClosingDate(),
                StringValues.normalize(command.fieldOfWorkCode()),
                StringValues.normalize(command.scopeOfWorkCode()),
                StringValues.normalize(command.reasonOfAbsenceCode()),
                command.siteBriefingDate(),
                command.tpSubmitDate(),
                StringValues.normalize(command.tpPassYn()),
                StringValues.normalize(command.primeContractor()),
                StringValues.normalize(command.remark()),
                normalizeYn(command.refmatYn()),
                createdId,
                lastChangedId
        );
        validateLengths(normalized);
        return normalized;
    }

    private String normalizeYn(String value) {
        String normalized = StringValues.normalize(value).toUpperCase();
        if (normalized.isEmpty() || "Y".equals(normalized) || "N".equals(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "YN 값은 Y 또는 N만 입력할 수 있습니다.");
    }

    private void validateLengths(NormalizedBidNotice value) {
        StringValues.validateMaxLength(value.departmentCode(), CODE_MAX_LENGTH, "departmentCode");
        StringValues.validateMaxLength(value.projectName(), PROJECT_NAME_MAX_LENGTH, "projectName");
        StringValues.validateMaxLength(value.orderClient(), ORDER_CLIENT_MAX_LENGTH, "orderClient");
        StringValues.validateMaxLength(value.bidType(), CODE_MAX_LENGTH, "bidType");
        StringValues.validateMaxLength(value.bidMethod(), CODE_MAX_LENGTH, "bidMethod");
        StringValues.validateMaxLength(value.orderMethod(), CODE_MAX_LENGTH, "orderMethod");
        StringValues.validateMaxLength(value.bidSuccessYn(), 1, "bidSuccessYn");
        StringValues.validateMaxLength(value.pqDecideEmpno(), CODE_MAX_LENGTH, "pqDecideEmpno");
        StringValues.validateMaxLength(value.superDecideEmpno(), CODE_MAX_LENGTH, "superDecideEmpno");
        StringValues.validateMaxLength(value.participateYn(), 1, "participateYn");
        StringValues.validateMaxLength(value.businessType(), CODE_MAX_LENGTH, "businessType");
        StringValues.validateMaxLength(value.processTag(), CODE_MAX_LENGTH, "processTag");
        StringValues.validateMaxLength(value.fieldOfWorkCode(), CODE_MAX_LENGTH, "fieldOfWorkCode");
        StringValues.validateMaxLength(value.scopeOfWorkCode(), CODE_MAX_LENGTH, "scopeOfWorkCode");
        StringValues.validateMaxLength(value.reasonOfAbsenceCode(), CODE_MAX_LENGTH, "reasonOfAbsenceCode");
        StringValues.validateMaxLength(value.tpPassYn(), 1, "tpPassYn");
        StringValues.validateMaxLength(value.primeContractor(), PRIME_CONTRACTOR_MAX_LENGTH, "primeContractor");
        StringValues.validateMaxLength(value.remark(), REMARK_MAX_LENGTH, "remark");
        StringValues.validateMaxLength(value.refmatYn(), 1, "refmatYn");
        StringValues.validateMaxLength(value.createdId(), AUDIT_ID_MAX_LENGTH, "createdId");
        StringValues.validateMaxLength(value.lastChangedId(), AUDIT_ID_MAX_LENGTH, "lastChangedId");
    }

    private BidNotice toDomain(NormalizedBidNotice normalized, Instant createdAt, String createdId, Instant lastChangedAt, String lastChangedId) {
        return new BidNotice(
                normalized.bidSeq(),
                normalized.departmentCode(),
                normalized.projectName(),
                normalized.orderClient(),
                normalized.designAmt(),
                normalized.bidType(),
                normalized.bidMethod(),
                normalized.announceDate(),
                normalized.pqRegistDate(),
                normalized.pqSubmitDate(),
                normalized.orderMethod(),
                normalized.bidDate(),
                normalized.interviewDate(),
                normalized.bidSuccessYn(),
                normalized.pqDecideEmpno(),
                normalized.pqDecideDate(),
                normalized.superDecideEmpno(),
                normalized.participateYn(),
                normalized.businessType(),
                normalized.bidSubmissionDate(),
                normalized.processTag(),
                normalized.bidClosingDate(),
                normalized.fieldOfWorkCode(),
                normalized.scopeOfWorkCode(),
                normalized.reasonOfAbsenceCode(),
                normalized.siteBriefingDate(),
                normalized.tpSubmitDate(),
                normalized.tpPassYn(),
                normalized.primeContractor(),
                normalized.remark(),
                normalized.refmatYn(),
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq는 1 이상의 값이어야 합니다.");
        }
        return bidSeq;
    }

    private record NormalizedBidNotice(
            Long bidSeq,
            String departmentCode,
            String projectName,
            String orderClient,
            java.math.BigDecimal designAmt,
            String bidType,
            String bidMethod,
            LocalDate announceDate,
            LocalDateTime pqRegistDate,
            LocalDateTime pqSubmitDate,
            String orderMethod,
            LocalDateTime bidDate,
            LocalDate interviewDate,
            String bidSuccessYn,
            String pqDecideEmpno,
            LocalDate pqDecideDate,
            String superDecideEmpno,
            String participateYn,
            String businessType,
            LocalDateTime bidSubmissionDate,
            String processTag,
            LocalDateTime bidClosingDate,
            String fieldOfWorkCode,
            String scopeOfWorkCode,
            String reasonOfAbsenceCode,
            LocalDateTime siteBriefingDate,
            LocalDateTime tpSubmitDate,
            String tpPassYn,
            String primeContractor,
            String remark,
            String refmatYn,
            String createdId,
            String lastChangedId
    ) {
    }
}
