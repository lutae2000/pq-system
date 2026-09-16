package com.cheil.cheil_be.application.shinindo.model;

import java.math.BigDecimal;

public record ShinindoManagementSaveCommand(
        String clientCode,
        String itemName,
        String appliedYn,
        BigDecimal score,
        String acquiredDate,
        String validUntil,
        String remark,
        String actor
) {
}
