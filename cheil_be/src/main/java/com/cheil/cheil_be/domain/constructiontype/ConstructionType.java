package com.cheil.cheil_be.domain.constructiontype;

import java.time.Instant;

/**
 * construction_type 테이블 도메인 모델.
 */
public record ConstructionType(
        Long codeId,
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        boolean useYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
