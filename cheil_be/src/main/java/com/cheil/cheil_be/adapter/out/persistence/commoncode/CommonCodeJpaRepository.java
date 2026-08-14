package com.cheil.cheil_be.adapter.out.persistence.commoncode;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

interface CommonCodeJpaRepository extends JpaRepository<CommonCodeEntity, Long> {

    boolean existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3Code(
            Integer codeLevel,
            String level1Code,
            String level2Code,
            String level3Code
    );

    boolean existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3CodeAndCodeIdNot(
            Integer codeLevel,
            String level1Code,
            String level2Code,
            String level3Code,
            Long codeId
    );

    Optional<CommonCodeEntity> findByCodeId(Long codeId);

    @Query("""
            select c
            from CommonCodeEntity c
            where c.codeLevel = :codeLevel
            and (:useYn is null or c.useYn = :useYn)
            """)
    java.util.List<CommonCodeEntity> findAllByCodeLevel(
            @Param("codeLevel") Integer codeLevel,
            @Param("useYn") Boolean useYn,
            Sort sort
    );

    @Query("""
            select c
            from CommonCodeEntity c
            where (
                :level1Code is null
                or (c.codeLevel = 1 and c.level2Code = :level1Code)
                or (c.codeLevel <> 1 and c.level1Code = :level1Code)
            )
            and (:useYn is null or c.useYn = :useYn)
            """)
    java.util.List<CommonCodeEntity> findAllByLevel1Code(
            @Param("level1Code") String level1Code,
            @Param("useYn") Boolean useYn,
            Sort sort
    );
}
