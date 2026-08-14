package com.cheil.cheil_be.domain.commoncode;

import java.time.Instant;

public record CommonCode (
        Long codeId,
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        String codeDetailName,
        String refValue1,
        Integer sortOrder,
        String remark,
        boolean useYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
