package com.cheil.cheil_be.adapter.in.web.shinindo;

import java.math.BigDecimal;

public record ShinindoManagementRequest(
        String clientCode,
        String itemName,
        String appliedYn,
        BigDecimal score,
        String acquiredDate,
        String validUntil,
        String remark
) {
}
