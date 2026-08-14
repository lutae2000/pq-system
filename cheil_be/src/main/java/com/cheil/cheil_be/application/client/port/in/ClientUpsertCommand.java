package com.cheil.cheil_be.application.client.port.in;

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
}
