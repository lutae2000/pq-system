package com.cheil.cheil_be.domain.servicetype;

import java.time.Instant;

public record ServiceType(
        String serviceTypeCode,
        String serviceTypeName,
        boolean useYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
