package com.cheil.cheil_be.adapter.in.web.commoncode;

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeSearchCondition;

public record CommonCodeBatchRequest(
        String key,
        Integer codeLevel,
        String level1Code,
        String level2Code,
        Boolean useYn
) {
    public CommonCodeSearchCondition toCondition() {
        return new CommonCodeSearchCondition(
                null,
                useYn,
                codeLevel,
                level1Code,
                level2Code,
                null,
                null,
                null,
                null,
                false
        );
    }
}
