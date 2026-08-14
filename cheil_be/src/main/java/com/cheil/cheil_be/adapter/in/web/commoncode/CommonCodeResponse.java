package com.cheil.cheil_be.adapter.in.web.commoncode;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.commoncode.CommonCode;

public record CommonCodeResponse(
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
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static CommonCodeResponse from(CommonCode commonCode) {
        return new CommonCodeResponse(
                commonCode.codeId(),
                commonCode.codeLevel(),
                commonCode.level1Code(),
                commonCode.level2Code(),
                commonCode.level3Code(),
                commonCode.codeName(),
                commonCode.codeDetailName(),
                commonCode.refValue1(),
                commonCode.sortOrder(),
                commonCode.remark(),
                commonCode.useYn(),
                commonCode.createdAt() == null ? null : commonCode.createdAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                commonCode.createdId(),
                commonCode.lastChangedAt() == null ? null : commonCode.lastChangedAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                commonCode.lastChangedId()
        );
    }
}
