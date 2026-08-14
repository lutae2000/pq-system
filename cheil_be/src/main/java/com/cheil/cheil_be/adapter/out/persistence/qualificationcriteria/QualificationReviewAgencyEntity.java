package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.in.web.qualificationcriteria.QualificationReviewAgencyRequest;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "pq_qualification_review_agencies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QualificationReviewAgencyEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "agency_code", nullable = false, length = 20)
    private String agencyCode;

    @Column(name = "agency_name", nullable = false, length = 200)
    private String agencyName;

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    public QualificationReviewAgencyEntity(QualificationReviewAgencyRequest request) {
        update(request);
    }

    public void update(QualificationReviewAgencyRequest request) {
        agencyCode = request.agencyCode();
        agencyName = request.agencyName();
        remark = request.remark();
        useYn = request.useYn() == null || request.useYn();
    }
}
