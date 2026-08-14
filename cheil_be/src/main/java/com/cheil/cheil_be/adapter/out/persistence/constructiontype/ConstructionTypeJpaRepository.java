package com.cheil.cheil_be.adapter.out.persistence.constructiontype;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ConstructionTypeJpaRepository extends JpaRepository<ConstructionTypeEntity, Long>, JpaSpecificationExecutor<ConstructionTypeEntity> {

    boolean existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3Code(Integer codeLevel, String level1Code, String level2Code, String level3Code);

    boolean existsByCodeLevelAndLevel1CodeAndLevel2CodeAndLevel3CodeAndCodeIdNot(
            Integer codeLevel,
            String level1Code,
            String level2Code,
            String level3Code,
            Long codeId
    );

    Optional<ConstructionTypeEntity> findByCodeId(Long codeId);
}
