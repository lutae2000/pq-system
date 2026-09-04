package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyPerformanceDocumentTargetJpaRepository extends JpaRepository<CompanyPerformanceDocumentTargetEntity, Long> {
    List<CompanyPerformanceDocumentTargetEntity> findByBidSeqOrderByTargetId(Long bidSeq);

    List<CompanyPerformanceDocumentTargetEntity> findByBidSeq(Long bidSeq);
}
