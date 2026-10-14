package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;

import java.time.Instant;

public record G2bBidNoticeSyncPersistenceRow(
        G2bBidNotice notice,
        Instant fetchedAt,
        String requestFrom,
        String requestTo
) {
}
