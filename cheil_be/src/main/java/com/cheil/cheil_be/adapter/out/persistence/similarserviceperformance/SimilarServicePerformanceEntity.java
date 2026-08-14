package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.in.web.similarserviceperformance.SimilarServicePerformanceRequest;
import com.cheil.cheil_be.adapter.in.web.similarserviceperformance.SimilarServicePerformanceResponse;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "similar_service_performances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SimilarServicePerformanceEntity extends AuditEntity {

    @Id
    @Column(name = "company_performance_seq")
    private Long companyPerformanceSeq;

    @Column(name = "service_name", length = 500)
    private String serviceName;

    @Column(name = "construction_type", length = 500)
    private String constructionType;

    @Column(name = "client", length = 500)
    private String client;

    @Column(name = "contract_from_date", length = 8)
    private String contractFromDate;

    @Column(name = "contract_to_date", length = 8)
    private String contractToDate;

    @Column(name = "construction_from_date", length = 8)
    private String constructionFromDate;

    @Column(name = "construction_to_date", length = 8)
    private String constructionToDate;

    @Column(name = "contract_price", precision = 10)
    private BigDecimal contractPrice;

    @Column(name = "share_ratio", precision = 3)
    private BigDecimal shareRatio;

    @Column(name = "weight", precision = 3)
    private BigDecimal weight;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public SimilarServicePerformanceEntity(Long companyPerformanceSeq, SimilarServicePerformanceRequest request) {
        this.companyPerformanceSeq = companyPerformanceSeq;
        update(request);
    }

    public void update(SimilarServicePerformanceRequest request) {
        serviceName = request.serviceName();
        constructionType = request.constructionType();
        client = request.client();
        contractFromDate = request.contractFromDate();
        contractToDate = request.contractToDate();
        constructionFromDate = request.constructionFromDate();
        constructionToDate = request.constructionToDate();
        contractPrice = request.contractPrice();
        shareRatio = request.shareRatio();
        weight = request.weight();
        summary = request.summary();
        remark = request.remark();
    }

    public SimilarServicePerformanceResponse toResponse() {
        return new SimilarServicePerformanceResponse(
                companyPerformanceSeq,
                companyPerformanceSeq,
                serviceName,
                constructionType,
                client,
                contractFromDate,
                contractToDate,
                constructionFromDate,
                constructionToDate,
                contractPrice,
                shareRatio,
                weight,
                summary,
                remark,
                createdAt == null ? null : createdAt.toString(),
                createdId,
                lastChangedAt == null ? null : lastChangedAt.toString(),
                lastChangedId
        );
    }
}
