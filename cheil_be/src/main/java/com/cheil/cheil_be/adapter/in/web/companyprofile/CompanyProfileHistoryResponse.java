package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;

import com.cheil.cheil_be.adapter.out.persistence.companyprofile.CompanyProfileHistEntity;

public record CompanyProfileHistoryResponse(
        Long histId,
        Instant changedAt,
        String changedBy,
        String changeType,
        String changeSummary,
        String snapshotJson
) {

    public static CompanyProfileHistoryResponse from(CompanyProfileHistEntity entity) {
        return new CompanyProfileHistoryResponse(
                entity.getHistId(),
                entity.getChangedAt(),
                entity.getChangedBy(),
                entity.getChangeType(),
                entity.getChangeSummary(),
                entity.getSnapshotJson()
        );
    }
}
