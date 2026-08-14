package com.cheil.cheil_be.domain.client;

import java.time.Instant;

public record Client(
        String clientCode,
        String orderName,
        String orderEngName,
        String businessNo,
        String corpNo,
        String orderNameLong,
        String owner,
        String businessSectors,
        String businessItems,
        String orderClass,
        String zipCode,
        String addr1,
        String addr2,
        String remark,
        String companyType,
        String homeUrl,
        String otype,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
