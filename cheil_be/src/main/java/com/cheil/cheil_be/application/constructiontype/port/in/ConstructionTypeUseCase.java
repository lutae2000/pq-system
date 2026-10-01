package com.cheil.cheil_be.application.constructiontype.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

/** 공사종류 관리 화면에서 사용하는 inbound use case 계약입니다. */
public interface ConstructionTypeUseCase {

    List<ConstructionType> findAll(ConstructionTypeSearchCondition condition);

    ConstructionType findByCodeId(Long codeId);

    ConstructionType create(ConstructionTypeUpsertCommand command);

    ConstructionType update(Long codeId, ConstructionTypeUpsertCommand command);

    void delete(Long codeId);
}
