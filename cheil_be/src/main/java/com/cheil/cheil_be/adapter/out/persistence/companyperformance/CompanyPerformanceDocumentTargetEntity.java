package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pq_company_performance_document_targets")
@Getter
@NoArgsConstructor
public class CompanyPerformanceDocumentTargetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "bid_seq", nullable = false)
    private Long bidSeq;

    @Column(name = "company_performance_seq", nullable = false)
    private Long companyPerformanceSeq;

    public CompanyPerformanceDocumentTargetEntity(Long bidSeq, Long companyPerformanceSeq) {
        this.bidSeq = bidSeq;
        this.companyPerformanceSeq = companyPerformanceSeq;
    }
}
