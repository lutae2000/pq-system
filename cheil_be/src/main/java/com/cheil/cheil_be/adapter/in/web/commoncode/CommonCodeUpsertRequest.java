package com.cheil.cheil_be.adapter.in.web.commoncode;

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeUpsertCommand;

public record CommonCodeUpsertRequest(
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        String codeDetailName,
        String refValue1,
        Integer sortOrder,
        String remark,
        Boolean useYn,
        String createdId,
        String lastChangedId
) {

    public CommonCodeUpsertCommand toCommand() {
        return new CommonCodeUpsertCommand(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                codeDetailName,
                refValue1,
                sortOrder,
                remark,
                useYn,
                createdId,
                lastChangedId
        );
    }
}
