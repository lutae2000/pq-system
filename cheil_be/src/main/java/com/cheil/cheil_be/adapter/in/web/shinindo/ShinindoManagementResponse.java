package com.cheil.cheil_be.adapter.in.web.shinindo;

import java.math.BigDecimal;
import java.time.Instant;

public record ShinindoManagementResponse(
        Long id,
        String clientCode,
        String clientName,
        String itemName,
        String appliedYn,
        BigDecimal score,
        String acquiredDate,
        String validUntil,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
