package com.cheil.batch.g2bbidnotice.application.model;

import java.time.ZonedDateTime;
import java.util.List;

public record G2bBidNoticeSyncCommand(
        ZonedDateTime from,
        ZonedDateTime to,
        List<String> regionCodes,
        int pageSize,
        boolean includeUnrestricted
) {
    public G2bBidNoticeSyncCommand {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new IllegalArgumentException("조회 시작일시는 종료일시보다 이전이어야 합니다.");
        }
        if (pageSize < 1 || pageSize > 999) {
            throw new IllegalArgumentException("페이지 크기는 1 이상 999 이하여야 합니다.");
        }
        regionCodes = regionCodes == null ? List.of() : List.copyOf(regionCodes);
    }
}
