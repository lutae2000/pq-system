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

import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewCriterionRequest;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "pq_qualification_review_criteria")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QualificationReviewCriterionEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "agency_id", nullable = false)
    private Long agencyId;

    @Column(name = "rule_code", nullable = false, length = 30)
    private String ruleCode;

    @Column(name = "revision_no", nullable = false, length = 20)
    private String revisionNo;

    @Column(name = "effective_date", length = 10)
    private String effectiveDate;

    @Column(name = "legal_basis", length = 300)
    private String legalBasis;

    @Column(name = "technical_weight", precision = 10, scale = 3)
    private BigDecimal technicalWeight;

    @Column(name = "price_weight", precision = 10, scale = 3)
    private BigDecimal priceWeight;

    @Column(name = "decision_method", length = 500)
    private String decisionMethod;

    @Column(name = "threshold_ratio", precision = 10, scale = 4)
    private BigDecimal thresholdRatio;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    public QualificationReviewCriterionEntity(QualificationReviewCriterionRequest request) {
        update(request);
    }

    public void update(QualificationReviewCriterionRequest request) {
        agencyId = request.agencyId();
        ruleCode = request.ruleCode();
        revisionNo = request.revisionNo();
        effectiveDate = request.effectiveDate();
        legalBasis = request.legalBasis();
        technicalWeight = request.technicalWeight();
        priceWeight = request.priceWeight();
        decisionMethod = request.decisionMethod();
        thresholdRatio = request.thresholdRatio();
        useYn = request.useYn() == null || request.useYn();
    }
}
