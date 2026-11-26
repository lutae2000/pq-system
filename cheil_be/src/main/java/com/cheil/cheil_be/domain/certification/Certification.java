package com.cheil.cheil_be.domain.certification;

import java.time.Instant;

/**
 * PQ 자격증 도메인 객체다.
 */
public record Certification(
        String certCode,
        String certName,
        int certKind,
        boolean useYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
    public static final int UNCLASSIFIED_KIND = 0;
}
