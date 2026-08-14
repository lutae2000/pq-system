package com.cheil.cheil_be.adapter.in.web.constructiontype;

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;

public record ConstructionTypeUpsertRequest(
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        Boolean useYn,
        String createdId,
        String lastChangedId
) {

    public ConstructionTypeUpsertCommand toCommand() {
        return new ConstructionTypeUpsertCommand(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                useYn,
                createdId,
                lastChangedId
        );
    }
}
