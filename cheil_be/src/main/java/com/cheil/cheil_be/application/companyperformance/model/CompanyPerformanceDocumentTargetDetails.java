package com.cheil.cheil_be.application.companyperformance.model;

import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

public record CompanyPerformanceDocumentTargetDetails(
        CompanyPerformanceDocumentTarget target,
        CompanyPerformance companyPerformance
) {}
