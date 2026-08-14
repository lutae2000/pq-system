package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface SimilarServicePerformanceJpaRepository extends JpaRepository<SimilarServicePerformanceEntity, Long>, JpaSpecificationExecutor<SimilarServicePerformanceEntity> {

    @Query("SELECT COALESCE(MAX(s.companyPerformanceSeq), 0) + 1 FROM SimilarServicePerformanceEntity s")
    Long nextId();
}
