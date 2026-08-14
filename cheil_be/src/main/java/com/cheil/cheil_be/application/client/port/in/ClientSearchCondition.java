package com.cheil.cheil_be.application.client.port.in;

public record ClientSearchCondition(
        String businessName,
        String orderClass,
        String companyType
) {
}
