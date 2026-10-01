package com.cheil.cheil_be.application.engineerperformancedoc.model;

import java.time.Instant;

/** 기술인별 문서 생성에 사용할 학력·자격 선택값이다. 웹 응답 DTO와 분리한다. */
public record DocumentValueSetting(
        Long bidSeq,
        String engineerId,
        Long educationId,
        Long licenseId,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
