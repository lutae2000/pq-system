package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SimilarServicePerformanceJpaRepository extends JpaRepository<SimilarServicePerformanceEntity, Long> {

    @Query("SELECT COALESCE(MAX(s.companyPerformanceSeq), 0) + 1 FROM SimilarServicePerformanceEntity s")
    Long nextId();

    @Query("""
            SELECT s
            FROM SimilarServicePerformanceEntity s
            WHERE (:keyword IS NULL
                   OR LOWER(COALESCE(s.serviceName, '')) LIKE CONCAT(CONCAT('%', :keyword), '%')
                   OR LOWER(COALESCE(s.constructionType, '')) LIKE CONCAT(CONCAT('%', :keyword), '%')
                   OR LOWER(COALESCE(s.client, '')) LIKE CONCAT(CONCAT('%', :keyword), '%')
                   OR LOWER(COALESCE(s.summary, '')) LIKE CONCAT(CONCAT('%', :keyword), '%')
                   OR LOWER(COALESCE(s.remark, '')) LIKE CONCAT(CONCAT('%', :keyword), '%'))
              AND (:constructionType IS NULL OR s.constructionType LIKE CONCAT(CONCAT('%', :constructionType), '%'))
              AND (:client IS NULL OR s.client LIKE CONCAT(CONCAT('%', :client), '%'))
              AND (:contractFromDate IS NULL OR s.contractFromDate >= :contractFromDate)
              AND (:contractToDate IS NULL OR s.contractToDate <= :contractToDate)
            """)
    Page<SimilarServicePerformanceEntity> search(
            @Param("keyword") String keyword,
            @Param("constructionType") String constructionType,
            @Param("client") String client,
            @Param("contractFromDate") String contractFromDate,
            @Param("contractToDate") String contractToDate,
            Pageable pageable
    );
}
