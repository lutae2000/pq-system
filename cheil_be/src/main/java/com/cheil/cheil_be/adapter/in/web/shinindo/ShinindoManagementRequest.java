package com.cheil.cheil_be.adapter.in.web.shinindo;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;

public record ShinindoManagementRequest(
        String clientCode,
        String itemName,
        String appliedYn,
        BigDecimal score,
        String acquiredDate,
        String validUntil,
        String remark
) {
    public ShinindoManagementSaveCommand toCommand() {
        return new ShinindoManagementSaveCommand(clientCode, itemName, appliedYn, score, acquiredDate, validUntil, remark, null);
    }
}
