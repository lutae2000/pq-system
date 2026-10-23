package com.cheil.cheil_be.application.client.model;

public record ClientSearchCondition(
        String businessName,
        String orderClass,
        String companyType
) {
}
