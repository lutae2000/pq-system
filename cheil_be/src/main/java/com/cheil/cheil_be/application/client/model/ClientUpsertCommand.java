package com.cheil.cheil_be.application.client.model;

import java.time.Instant;

import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.client.Client;

public record ClientUpsertCommand(
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
        String createdId,
        String lastChangedId
) {

    public ClientUpsertCommand {
        clientCode = InputValues.requiredText(clientCode, 20, "clientCode");
        orderName = InputValues.requiredText(orderName, 300, "orderName");
        orderEngName = optional(orderEngName, 300, "orderEngName");
        businessNo = optional(businessNo, 20, "businessNo");
        corpNo = optional(corpNo, 20, "corpNo");
        orderNameLong = optional(orderNameLong, 300, "orderNameLong");
        owner = optional(owner, 100, "owner");
        businessSectors = optional(businessSectors, 100, "businessSectors");
        businessItems = optional(businessItems, 100, "businessItems");
        orderClass = optional(orderClass, 20, "orderClass");
        zipCode = optional(zipCode, 20, "zipCode");
        addr1 = optional(addr1, 500, "addr1");
        addr2 = optional(addr2, 500, "addr2");
        remark = optional(remark, 1000, "remark");
        companyType = optional(companyType, 20, "companyType");
        homeUrl = optional(homeUrl, 500, "homeUrl");
        otype = optional(otype, 20, "otype");
        createdId = optional(createdId, 100, "createdId");
        lastChangedId = optional(lastChangedId, 100, "lastChangedId");
    }

    public Client toDomain(Client existing, Instant now) {
        String resolvedOrderNameLong = StringValues.optional(orderNameLong, orderName);
        String resolvedCreatedId = StringValues.optional(createdId, existing == null ? "admin" : existing.createdId());
        String resolvedLastChangedId = StringValues.optional(lastChangedId, resolvedCreatedId);
        return new Client(
                clientCode, orderName, orderEngName, businessNo, corpNo, resolvedOrderNameLong,
                owner, businessSectors, businessItems, orderClass, zipCode, addr1, addr2,
                remark, companyType, homeUrl, otype,
                existing == null ? now : existing.createdAt(),
                resolvedCreatedId,
                now,
                resolvedLastChangedId
        );
    }

    private static String optional(String value, int maxLength, String fieldName) {
        String normalized = StringValues.trimToNull(value);
        InputValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }
}
