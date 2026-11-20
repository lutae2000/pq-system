package com.cheil.cheil_be.application.serviceperformance.model;

import com.cheil.cheil_be.domain.serviceperformance.ServicePerformanceWorkType;

public record ServicePerformanceImportSearch(
        ServicePerformanceWorkType workType, String client, String serviceName, String serviceCategory, String detailField) {
}
