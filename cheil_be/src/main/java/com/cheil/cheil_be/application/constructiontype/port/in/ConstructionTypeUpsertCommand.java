package com.cheil.cheil_be.application.constructiontype.port.in;

public record ConstructionTypeUpsertCommand(
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        Boolean useYn,
        String createdId,
        String lastChangedId
) {
}
