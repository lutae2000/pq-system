package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Entity
@Table(name = "bid_notices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class BidNoticeEntity {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
    private static final DateTimeFormatter HUMAN_DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter HUMAN_DATETIME_SECONDS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bid_seq")
    private Long bidSeq;

    @Column(name = "department_code", length = 50)
    private String departmentCode;

    @Column(name = "project_name", nullable = false, length = 500)
    private String projectName;

    @Column(name = "order_client", length = 300)
    private String orderClient;

    @Column(name = "design_amt", precision = 19, scale = 2)
    private BigDecimal designAmt;

    @Column(name = "bid_type", length = 50)
    private String bidType;

    @Column(name = "bid_method", length = 50)
    private String bidMethod;

    @Column(name = "announce_date", length = 8)
    private String announceDate;

    @Column(name = "pq_regist_date", length = 12)
    private String pqRegistDate;

    @Column(name = "pq_submit_date", length = 12)
    private String pqSubmitDate;

    @Column(name = "order_method", length = 50)
    private String orderMethod;

    @Column(name = "bid_date", length = 12)
    private String bidDate;

    @Column(name = "bid_sucess_yn", length = 1)
    private String bidSuccessYn;

    @Column(name = "pq_decide_empno", length = 50)
    private String pqDecideEmpno;

    @Column(name = "pq_decide_date", length = 8)
    private String pqDecideDate;

    @Column(name = "super_decide_empno", length = 50)
    private String superDecideEmpno;

    @Column(name = "participate_yn", length = 1)
    private String participateYn;

    @Column(name = "business_type", length = 50)
    private String businessType;

    @Column(name = "bid_submission_date", length = 12)
    private String bidSubmissionDate;

    @Column(name = "process_tag", length = 50)
    private String processTag;

    @Column(name = "bid_closing_date", length = 12)
    private String bidClosingDate;

    @Column(name = "field_of_work_code", length = 50)
    private String fieldOfWorkCode;

    @Column(name = "scope_of_work_code", length = 50)
    private String scopeOfWorkCode;

    @Column(name = "reason_of_absence_code", length = 50)
    private String reasonOfAbsenceCode;

    @Column(name = "site_briefing_date", length = 12)
    private String siteBriefingDate;

    @Column(name = "tp_submit_date", length = 12)
    private String tpSubmitDate;

    @Column(name = "tp_pass_yn", length = 1)
    private String tpPassYn;

    @Column(name = "prime_contractor", length = 300)
    private String primeContractor;

    @Column(name = "remark", length = 2000)
    private String remark;

    @Column(name = "refmat_yn", length = 1)
    private String refmatYn;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_id", length = 100)
    private String createdId;

    @Column(name = "last_changed_at")
    private Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100)
    private String lastChangedId;

    static BidNoticeEntity from(BidNotice bidNotice) {
        return BidNoticeEntity.builder()
                .bidSeq(bidNotice.bidSeq())
                .departmentCode(bidNotice.departmentCode())
                .projectName(bidNotice.projectName())
                .orderClient(bidNotice.orderClient())
                .designAmt(bidNotice.designAmt())
                .bidType(bidNotice.bidType())
                .announceDate(formatDate(bidNotice.announceDate()))
                .pqRegistDate(formatDateTime(bidNotice.pqRegistDate()))
                .pqSubmitDate(formatDateTime(bidNotice.pqSubmitDate()))
                .orderMethod(bidNotice.orderMethod())
                .bidDate(formatDateTime(bidNotice.bidDate()))
                .bidSuccessYn(bidNotice.bidSuccessYn())
                .pqDecideEmpno(bidNotice.pqDecideEmpno())
                .pqDecideDate(formatDate(bidNotice.pqDecideDate()))
                .superDecideEmpno(bidNotice.superDecideEmpno())
                .participateYn(bidNotice.participateYn())
                .businessType(bidNotice.businessType())
                .bidSubmissionDate(formatDateTime(bidNotice.bidSubmissionDate()))
                .processTag(bidNotice.processTag())
                .bidClosingDate(formatDateTime(bidNotice.bidClosingDate()))
                .fieldOfWorkCode(bidNotice.fieldOfWorkCode())
                .scopeOfWorkCode(bidNotice.scopeOfWorkCode())
                .reasonOfAbsenceCode(bidNotice.reasonOfAbsenceCode())
                .siteBriefingDate(formatDateTime(bidNotice.siteBriefingDate()))
                .tpSubmitDate(formatDateTime(bidNotice.tpSubmitDate()))
                .tpPassYn(bidNotice.tpPassYn())
                .primeContractor(bidNotice.primeContractor())
                .remark(bidNotice.remark())
                .refmatYn(bidNotice.refmatYn())
                .createdAt(bidNotice.createdAt())
                .createdId(bidNotice.createdId())
                .lastChangedAt(bidNotice.lastChangedAt())
                .lastChangedId(bidNotice.lastChangedId())
                .build();
    }

    void updateFrom(BidNotice bidNotice) {
        departmentCode = bidNotice.departmentCode();
        projectName = bidNotice.projectName();
        orderClient = bidNotice.orderClient();
        designAmt = bidNotice.designAmt();
        bidType = bidNotice.bidType();
        announceDate = formatDate(bidNotice.announceDate());
        pqRegistDate = formatDateTime(bidNotice.pqRegistDate());
        pqSubmitDate = formatDateTime(bidNotice.pqSubmitDate());
        orderMethod = bidNotice.orderMethod();
        bidDate = formatDateTime(bidNotice.bidDate());
        bidSuccessYn = bidNotice.bidSuccessYn();
        pqDecideEmpno = bidNotice.pqDecideEmpno();
        pqDecideDate = formatDate(bidNotice.pqDecideDate());
        superDecideEmpno = bidNotice.superDecideEmpno();
        participateYn = bidNotice.participateYn();
        businessType = bidNotice.businessType();
        bidSubmissionDate = formatDateTime(bidNotice.bidSubmissionDate());
        processTag = bidNotice.processTag();
        bidClosingDate = formatDateTime(bidNotice.bidClosingDate());
        fieldOfWorkCode = bidNotice.fieldOfWorkCode();
        scopeOfWorkCode = bidNotice.scopeOfWorkCode();
        reasonOfAbsenceCode = bidNotice.reasonOfAbsenceCode();
        siteBriefingDate = formatDateTime(bidNotice.siteBriefingDate());
        tpSubmitDate = formatDateTime(bidNotice.tpSubmitDate());
        tpPassYn = bidNotice.tpPassYn();
        primeContractor = bidNotice.primeContractor();
        remark = bidNotice.remark();
        refmatYn = bidNotice.refmatYn();
        createdAt = bidNotice.createdAt();
        createdId = bidNotice.createdId();
        lastChangedAt = bidNotice.lastChangedAt();
        lastChangedId = bidNotice.lastChangedId();
    }

    BidNotice toDomain() {
        return new BidNotice(
                bidSeq,
                departmentCode,
                projectName,
                orderClient,
                designAmt,
                bidType,
                bidMethod,
                parseDate(announceDate),
                parseDateTime(pqRegistDate),
                parseDateTime(pqSubmitDate),
                orderMethod,
                parseDateTime(bidDate),
                bidSuccessYn,
                pqDecideEmpno,
                parseDate(pqDecideDate),
                superDecideEmpno,
                participateYn,
                businessType,
                parseDateTime(bidSubmissionDate),
                processTag,
                parseDateTime(bidClosingDate),
                fieldOfWorkCode,
                scopeOfWorkCode,
                reasonOfAbsenceCode,
                parseDateTime(siteBriefingDate),
                parseDateTime(tpSubmitDate),
                tpPassYn,
                primeContractor,
                remark,
                refmatYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }

    private static String formatDate(LocalDate value) {
        return value == null ? null : DATE_FORMAT.format(value);
    }

    private static String formatDateTime(LocalDateTime value) {
        return value == null ? null : DATETIME_FORMAT.format(value);
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.chars().allMatch(Character::isDigit) && normalized.length() >= 8) {
            return LocalDate.parse(normalized.substring(0, 8), DATE_FORMAT);
        }
        return LocalDate.parse(normalized);
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().replace('T', ' ');
        if (normalized.chars().allMatch(Character::isDigit) && normalized.length() >= 12) {
            return LocalDateTime.parse(normalized.substring(0, 12), DATETIME_FORMAT);
        }
        if (normalized.length() == 16) {
            return LocalDateTime.parse(normalized, HUMAN_DATETIME_FORMAT);
        }
        if (normalized.length() >= 19) {
            return LocalDateTime.parse(normalized.substring(0, 19), HUMAN_DATETIME_SECONDS_FORMAT);
        }
        return LocalDateTime.parse(normalized);
    }
}
