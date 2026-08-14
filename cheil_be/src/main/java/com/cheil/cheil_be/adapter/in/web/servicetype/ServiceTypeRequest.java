package com.cheil.cheil_be.adapter.in.web.servicetype;

import com.cheil.cheil_be.application.servicetype.port.in.ServiceTypeUpsertCommand;

public record ServiceTypeRequest(
        String serviceTypeCode,
        String serviceTypeName,
        Boolean useYn
) {

    public ServiceTypeUpsertCommand toCommand() {
        return new ServiceTypeUpsertCommand(
                serviceTypeCode,
                serviceTypeName,
                useYn
        );
    }
}
