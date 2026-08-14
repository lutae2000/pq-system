package com.cheil.cheil_be.adapter.in.web.constructiontype;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

public record ConstructionTypeResponse(
        Long codeId,
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        boolean useYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static ConstructionTypeResponse from(ConstructionType constructionType) {
        return new ConstructionTypeResponse(
                constructionType.codeId(),
                constructionType.codeLevel(),
                constructionType.level1Code(),
                constructionType.level2Code(),
                constructionType.level3Code(),
                constructionType.codeName(),
                constructionType.useYn(),
                constructionType.createdAt() == null ? null : constructionType.createdAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                constructionType.createdId(),
                constructionType.lastChangedAt() == null ? null : constructionType.lastChangedAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                constructionType.lastChangedId()
        );
    }
}
