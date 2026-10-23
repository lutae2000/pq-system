package com.cheil.cheil_be.application.newtechnology.model;

public record NewTechnologyUsageSearch(
        String keyword,
        String designationNo,
        String client,
        String noticeDateFrom,
        String noticeDateTo
) {
}
