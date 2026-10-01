package com.cheil.cheil_be.application.bidnotice.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException;
import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException.Type;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeAdminUseCase;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeUpsertCommand;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Service
@RequiredArgsConstructor
public class BidNoticeAdminService implements BidNoticeAdminUseCase {

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
                .orElseThrow(() -> failure(Type.NOT_FOUND, "공고문을 찾을 수 없습니다."));
    }

    @Transactional
    public BidNotice create(BidNoticeUpsertCommand command) {
        NormalizedBidNotice normalized = normalize(command, null);
        if (normalized.bidSeq() != null && bidNoticeRepository.existsByBidSeq(normalized.bidSeq())) {
            throw failure(Type.CONFLICT, "이미 등록된 공고문 번호입니다.");
        }

        Instant now = Instant.now(clock);
        return bidNoticeRepository.save(toDomain(normalized, now, normalized.createdId(), now, normalized.lastChangedId()));
    }

    @Transactional
    public BidNotice update(Long bidSeq, BidNoticeUpsertCommand command) {
        BidNotice existing = findByBidSeq(bidSeq);
        NormalizedBidNotice normalized = normalize(command, existing);
        if (!bidSeq.equals(normalized.bidSeq())) {
            throw failure(Type.BAD_REQUEST, "공고문 번호는 수정할 수 없습니다.");
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
            throw failure(Type.BAD_REQUEST, "공고문 요청 본문이 필요합니다.");
        }

        String projectName = required(command.projectName(), "projectName");
        String createdId = optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = optional(command.lastChangedId(), createdId);
        Long bidSeq = existing == null ? command.bidSeq() : existing.bidSeq();

        NormalizedBidNotice normalized = new NormalizedBidNotice(
                bidSeq,
                normalize(command.departmentCode()),
                projectName,
                normalize(command.orderClient()),
                command.designAmt(),
                normalize(command.bidType()),
                normalize(command.bidMethod()),
                command.announceDate(),
                command.pqRegistDate(),
                command.pqSubmitDate(),
                normalize(command.orderMethod()),
                command.bidDate(),
                command.interviewDate(),
                normalize(command.bidSuccessYn()),
                normalize(command.pqDecideEmpno()),
                command.pqDecideDate(),
                normalize(command.superDecideEmpno()),
                normalizeYn(command.participateYn()),
                normalize(command.businessType()),
                command.bidSubmissionDate(),
                normalize(command.processTag()),
                command.bidClosingDate(),
                normalize(command.fieldOfWorkCode()),
                normalize(command.scopeOfWorkCode()),
                normalize(command.reasonOfAbsenceCode()),
                command.siteBriefingDate(),
                command.tpSubmitDate(),
                normalize(command.tpPassYn()),
                normalize(command.primeContractor()),
                normalize(command.remark()),
                normalizeYn(command.refmatYn()),
                createdId,
                lastChangedId
        );
        validateLengths(normalized);
        return normalized;
    }

    private String normalizeYn(String value) {
        String normalized = normalize(value).toUpperCase();
        if (normalized.isEmpty() || "Y".equals(normalized) || "N".equals(normalized)) {
            return normalized;
        }
        throw failure(Type.BAD_REQUEST, "YN 값은 Y 또는 N만 입력할 수 있습니다.");
    }

    private void validateLengths(NormalizedBidNotice value) {
        validateMaxLength(value.departmentCode(), CODE_MAX_LENGTH, "departmentCode");
        validateMaxLength(value.projectName(), PROJECT_NAME_MAX_LENGTH, "projectName");
        validateMaxLength(value.orderClient(), ORDER_CLIENT_MAX_LENGTH, "orderClient");
        validateMaxLength(value.bidType(), CODE_MAX_LENGTH, "bidType");
        validateMaxLength(value.bidMethod(), CODE_MAX_LENGTH, "bidMethod");
        validateMaxLength(value.orderMethod(), CODE_MAX_LENGTH, "orderMethod");
        validateMaxLength(value.bidSuccessYn(), 1, "bidSuccessYn");
        validateMaxLength(value.pqDecideEmpno(), CODE_MAX_LENGTH, "pqDecideEmpno");
        validateMaxLength(value.superDecideEmpno(), CODE_MAX_LENGTH, "superDecideEmpno");
        validateMaxLength(value.participateYn(), 1, "participateYn");
        validateMaxLength(value.businessType(), CODE_MAX_LENGTH, "businessType");
        validateMaxLength(value.processTag(), CODE_MAX_LENGTH, "processTag");
        validateMaxLength(value.fieldOfWorkCode(), CODE_MAX_LENGTH, "fieldOfWorkCode");
        validateMaxLength(value.scopeOfWorkCode(), CODE_MAX_LENGTH, "scopeOfWorkCode");
        validateMaxLength(value.reasonOfAbsenceCode(), CODE_MAX_LENGTH, "reasonOfAbsenceCode");
        validateMaxLength(value.tpPassYn(), 1, "tpPassYn");
        validateMaxLength(value.primeContractor(), PRIME_CONTRACTOR_MAX_LENGTH, "primeContractor");
        validateMaxLength(value.remark(), REMARK_MAX_LENGTH, "remark");
        validateMaxLength(value.refmatYn(), 1, "refmatYn");
        validateMaxLength(value.createdId(), AUDIT_ID_MAX_LENGTH, "createdId");
        validateMaxLength(value.lastChangedId(), AUDIT_ID_MAX_LENGTH, "lastChangedId");
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

    private static String normalize(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private static String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized.isEmpty()) {
            throw failure(Type.BAD_REQUEST, fieldName + "은(는) 필수입니다.");
        }
        return normalized;
    }

    private static String optional(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? fallback : normalized;
    }

    private static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw failure(Type.BAD_REQUEST, fieldName + "은(는) " + maxLength + "자 이하로 입력해야 합니다.");
        }
    }

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            throw failure(Type.BAD_REQUEST, "bidSeq는 1 이상의 값이어야 합니다.");
        }
        return bidSeq;
    }

    private static BidNoticeApplicationException failure(Type type, String message) {
        return new BidNoticeApplicationException(type, message);
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
