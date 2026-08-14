package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationScoreBandRequest;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "pq_qualification_score_bands")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QualificationScoreBandEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "min_price", precision = 18)
    private BigDecimal minPrice;

    @Column(name = "max_price", precision = 18)
    private BigDecimal maxPrice;

    @Column(name = "price_text", length = 200)
    private String priceText;

    @Column(name = "pass_score", precision = 10, scale = 3)
    private BigDecimal passScore;

    @Column(name = "technical_score", precision = 10, scale = 3)
    private BigDecimal technicalScore;

    @Column(name = "career_score", precision = 10, scale = 3)
    private BigDecimal careerScore;

    @Column(name = "region_score", precision = 10, scale = 3)
    private BigDecimal regionScore;

    @Column(name = "management_score", precision = 10, scale = 3)
    private BigDecimal managementScore;

    @Column(name = "price_score", precision = 10, scale = 3)
    private BigDecimal priceScore;

    @Column(name = "price_multiplier", precision = 10, scale = 3)
    private BigDecimal priceMultiplier;

    @Column(name = "price_formula", length = 500)
    private String priceFormula;

    @Column(name = "technical_average_score", precision = 10, scale = 3)
    private BigDecimal technicalAverageScore;

    @Column(name = "total_average_score", precision = 10, scale = 3)
    private BigDecimal totalAverageScore;

    @Column(name = "lowest_bid_price", precision = 10, scale = 3)
    private BigDecimal lowestBidPrice;

    @Column(name = "pq_available_score", precision = 10, scale = 3)
    private BigDecimal pqAvailableScore;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "remark", length = 500)
    private String remark;

    public QualificationScoreBandEntity(QualificationScoreBandRequest request) {
        update(request);
    }

    public void update(QualificationScoreBandRequest request) {
        criterionId = request.criterionId();
        sortOrder = request.sortOrder();
        minPrice = request.minPrice();
        maxPrice = request.maxPrice();
        priceText = request.priceText();
        passScore = request.passScore();
        technicalScore = request.technicalScore();
        careerScore = request.careerScore();
        regionScore = request.regionScore();
        managementScore = request.managementScore();
        priceScore = request.priceScore();
        priceMultiplier = request.priceMultiplier();
        priceFormula = request.priceFormula();
        technicalAverageScore = request.technicalAverageScore();
        totalAverageScore = request.totalAverageScore();
        lowestBidPrice = request.lowestBidPrice();
        pqAvailableScore = request.pqAvailableScore();
        useYn = request.useYn() == null || request.useYn();
        remark = request.remark();
    }
}
