package com.cheil.cheil_be.application.constructiontype.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.constructiontype.ConstructionType;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;

public interface ConstructionTypeRepository {

    List<ConstructionType> findAll();

    List<ConstructionType> findAll(ConstructionTypeSearchCondition condition);

    Optional<ConstructionType> findByCodeId(Long codeId);

    boolean existsByCodeId(Long codeId);

    boolean existsByNaturalKey(Integer codeLevel, String level1Code, String level2Code, String level3Code);

    boolean existsByNaturalKeyAndCodeIdNot(Integer codeLevel, String level1Code, String level2Code, String level3Code, Long codeId);

    ConstructionType save(ConstructionType constructionType);

    void deleteByCodeId(Long codeId);
}
