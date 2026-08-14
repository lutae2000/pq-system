package com.cheil.cheil_be.application.commoncode.port.in;

public record CommonCodeUpsertCommand(
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
}
