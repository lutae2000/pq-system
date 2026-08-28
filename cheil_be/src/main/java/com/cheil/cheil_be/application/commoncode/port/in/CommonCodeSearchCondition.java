package com.cheil.cheil_be.application.commoncode.port.in;

public record CommonCodeSearchCondition(
        String keyword,
        Boolean useYn,
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level2CodePrefix,
        String level3Code,
        String refValue1Contains,
        String sort,
        boolean bypassCache
) {
}
