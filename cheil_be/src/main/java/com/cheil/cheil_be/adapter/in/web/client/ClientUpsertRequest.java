package com.cheil.cheil_be.adapter.in.web.client;

import com.cheil.cheil_be.application.client.port.in.ClientUpsertCommand;

public record ClientUpsertRequest(
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

    public ClientUpsertCommand toCommand() {
        return new ClientUpsertCommand(
                clientCode,
                orderName,
                orderEngName,
                businessNo,
                corpNo,
                orderNameLong,
                owner,
                businessSectors,
                businessItems,
                orderClass,
                zipCode,
                addr1,
                addr2,
                remark,
                companyType,
                homeUrl,
                otype,
                createdId,
                lastChangedId
        );
    }
}
