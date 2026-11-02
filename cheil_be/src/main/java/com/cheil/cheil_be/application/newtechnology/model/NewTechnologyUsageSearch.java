package com.cheil.cheil_be.application.newtechnology.model;

public record NewTechnologyUsageSearch(
        String keyword,
        String designationNo,
        String client,
        String workCategory,
        String technologyType,
        String noticeDateFrom,
        String noticeDateTo
) {
}
