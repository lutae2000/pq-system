package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import java.math.BigDecimal;
import java.time.Instant;

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

import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

@Entity
@Table(name = "company_performances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
class CompanyPerformanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq", nullable = false)
    private Long seq;

    @Column(name = "job_seq")
    private Long jobSeq;

    @Column(name = "job_name", length = 500)
    private String jobName;

    @Column(name = "job_own_yn", length = 1)
    private String jobOwnYn;

    @Column(name = "general_management", length = 1)
    private String generalManagement;

    @Column(name = "contract_from_date", length = 8)
    private String contractFromDate;

    @Column(name = "contract_to_date", length = 8)
    private String contractToDate;

    @Column(name = "job_finish_yn", length = 1)
    private String jobFinishYn;

    @Column(name = "stop_date", length = 10)
    private String stopDate;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "job_type", length = 20)
    private String jobType;

    @Column(name = "job_ratio", length = 200)
    private String jobRatio;

    @Column(name = "contract_amt")
    private Long contractAmt;

    @Column(name = "own_amt")
    private Long ownAmt;

    @Column(name = "order_client", length = 300)
    private String orderClient;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "division_rate", precision = 7, scale = 2)
    private BigDecimal divisionRate;

    @Column(name = "client_kind", length = 20)
    private String clientKind;

    @Column(name = "business_type", length = 20)
    private String businessType;

    @Column(name = "oversee_yn", length = 1)
    private String overseeYn;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_id", length = 100)
    private String createdId;

    @Column(name = "last_changed_at")
    private Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100)
    private String lastChangedId;

    static CompanyPerformanceEntity from(CompanyPerformance companyPerformance) {
        return CompanyPerformanceEntity.builder()
                .seq(companyPerformance.seq())
                .jobSeq(companyPerformance.jobSeq())
                .jobName(companyPerformance.jobName())
                .jobOwnYn(companyPerformance.jobOwnYn())
                .generalManagement(companyPerformance.generalManagement())
                .contractFromDate(companyPerformance.contractFromDate())
                .contractToDate(companyPerformance.contractToDate())
                .jobFinishYn(companyPerformance.jobFinishYn())
                .stopDate(companyPerformance.stopDate())
                .summary(companyPerformance.summary())
                .jobType(companyPerformance.jobType())
                .jobRatio(companyPerformance.jobRatio())
                .contractAmt(companyPerformance.contractAmt())
                .ownAmt(companyPerformance.ownAmt())
                .orderClient(companyPerformance.orderClient())
                .remark(companyPerformance.remark())
                .divisionRate(companyPerformance.divisionRate())
                .clientKind(companyPerformance.clientKind())
                .businessType(companyPerformance.businessType())
                .overseeYn(companyPerformance.overseeYn())
                .createdAt(companyPerformance.createdAt())
                .createdId(companyPerformance.createdId())
                .lastChangedAt(companyPerformance.lastChangedAt())
                .lastChangedId(companyPerformance.lastChangedId())
                .build();
    }

    void updateFrom(CompanyPerformance companyPerformance) {
        jobSeq = companyPerformance.jobSeq();
        jobName = companyPerformance.jobName();
        jobOwnYn = companyPerformance.jobOwnYn();
        generalManagement = companyPerformance.generalManagement();
        contractFromDate = companyPerformance.contractFromDate();
        contractToDate = companyPerformance.contractToDate();
        jobFinishYn = companyPerformance.jobFinishYn();
        stopDate = companyPerformance.stopDate();
        summary = companyPerformance.summary();
        jobType = companyPerformance.jobType();
        jobRatio = companyPerformance.jobRatio();
        contractAmt = companyPerformance.contractAmt();
        ownAmt = companyPerformance.ownAmt();
        orderClient = companyPerformance.orderClient();
        remark = companyPerformance.remark();
        divisionRate = companyPerformance.divisionRate();
        clientKind = companyPerformance.clientKind();
        businessType = companyPerformance.businessType();
        overseeYn = companyPerformance.overseeYn();
        createdAt = companyPerformance.createdAt();
        createdId = companyPerformance.createdId();
        lastChangedAt = companyPerformance.lastChangedAt();
        lastChangedId = companyPerformance.lastChangedId();
    }

    CompanyPerformance toDomain() {
        return new CompanyPerformance(
                seq,
                jobSeq,
                jobName,
                jobOwnYn,
                generalManagement,
                contractFromDate,
                contractToDate,
                jobFinishYn,
                stopDate,
                summary,
                jobType,
                jobRatio,
                contractAmt,
                ownAmt,
                orderClient,
                remark,
                divisionRate,
                clientKind,
                businessType,
                overseeYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
