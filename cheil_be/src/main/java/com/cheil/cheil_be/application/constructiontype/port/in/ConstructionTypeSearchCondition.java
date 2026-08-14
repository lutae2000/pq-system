package com.cheil.cheil_be.application.constructiontype.port.in;

public record ConstructionTypeSearchCondition(
        String keyword,
        Boolean useYn,
        Integer codeLevel,
        String level1Code,
        String level2Code
) {
}
