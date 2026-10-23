package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyProfileHistoryResponse(
        Long histId,
        Instant changedAt,
        String changedBy,
        String changeType,
        String changeSummary,
        String snapshotJson
) {

    public static CompanyProfileHistoryResponse from(CompanyProfileUseCase.History entity) {
        return new CompanyProfileHistoryResponse(
                entity.histId(), entity.changedAt(), entity.changedBy(), entity.changeType(),
                entity.changeSummary(), entity.snapshotJson()
        );
    }
}
