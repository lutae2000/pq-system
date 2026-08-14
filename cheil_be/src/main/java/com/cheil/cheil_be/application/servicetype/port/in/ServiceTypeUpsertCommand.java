package com.cheil.cheil_be.application.servicetype.port.in;

public record ServiceTypeUpsertCommand(
        String serviceTypeCode,
        String serviceTypeName,
        Boolean useYn
) {
}
