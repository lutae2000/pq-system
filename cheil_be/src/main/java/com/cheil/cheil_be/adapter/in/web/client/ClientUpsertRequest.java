package com.cheil.cheil_be.adapter.in.web.client;

import com.cheil.cheil_be.application.client.model.ClientUpsertCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientUpsertRequest(
        @NotBlank @Size(max = 20) String clientCode,
        @NotBlank @Size(max = 300) String orderName,
        @Size(max = 300) String orderEngName,
        @Size(max = 20) String businessNo,
        @Size(max = 20) String corpNo,
        @Size(max = 300) String orderNameLong,
        @Size(max = 100) String owner,
        @Size(max = 100) String businessSectors,
        @Size(max = 100) String businessItems,
        @Size(max = 20) String orderClass,
        @Size(max = 20) String zipCode,
        @Size(max = 500) String addr1,
        @Size(max = 500) String addr2,
        @Size(max = 1000) String remark,
        @Size(max = 20) String companyType,
        @Size(max = 500) String homeUrl,
        @Size(max = 20) String otype,
        @Size(max = 100) String createdId,
        @Size(max = 100) String lastChangedId
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
