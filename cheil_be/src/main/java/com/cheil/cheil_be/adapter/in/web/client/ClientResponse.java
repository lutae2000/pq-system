package com.cheil.cheil_be.adapter.in.web.client;

import java.time.Instant;

import com.cheil.cheil_be.domain.client.Client;

public record ClientResponse(
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

    static ClientResponse from(Client client) {
        return new ClientResponse(
                client.clientCode(),
                client.orderName(),
                client.orderEngName(),
                client.businessNo(),
                client.corpNo(),
                client.orderNameLong(),
                client.owner(),
                client.businessSectors(),
                client.businessItems(),
                client.orderClass(),
                client.zipCode(),
                client.addr1(),
                client.addr2(),
                client.remark(),
                client.companyType(),
                client.homeUrl(),
                client.otype(),
                client.createdAt(),
                client.createdId(),
                client.lastChangedAt(),
                client.lastChangedId()
        );
    }
}
