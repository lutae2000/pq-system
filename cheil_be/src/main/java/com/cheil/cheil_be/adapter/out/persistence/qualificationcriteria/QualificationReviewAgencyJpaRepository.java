package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QualificationReviewAgencyJpaRepository extends JpaRepository<QualificationReviewAgencyEntity, Long> {

    boolean existsByAgencyCode(String agencyCode);

    boolean existsByAgencyCodeAndIdNot(String agencyCode, Long id);

    @Query("""
            select a from QualificationReviewAgencyEntity a
            where (:useYn is null or a.useYn = :useYn)
              and (:keyword is null or locate(:keyword, lower(a.agencyCode)) > 0
                   or locate(:keyword, lower(a.agencyName)) > 0)
            order by a.agencyCode asc
            """)
    List<QualificationReviewAgencyEntity> search(@Param("keyword") String keyword, @Param("useYn") Boolean useYn);
}
