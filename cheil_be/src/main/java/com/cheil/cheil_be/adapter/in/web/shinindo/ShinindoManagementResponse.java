package com.cheil.cheil_be.adapter.in.web.shinindo;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;

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
    public static ShinindoManagementResponse from(ShinindoManagement management) {
        return new ShinindoManagementResponse(
                management.id(),
                management.clientCode(),
                management.clientName(),
                management.itemName(),
                management.appliedYn(),
                management.score(),
                management.acquiredDate(),
                management.validUntil(),
                management.remark(),
                management.createdAt(),
                management.createdId(),
                management.lastChangedAt(),
                management.lastChangedId()
        );
    }
}
