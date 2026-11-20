package com.cheil.cheil_be.application.serviceperformance.model;
import com.cheil.cheil_be.domain.serviceperformance.ServicePerformanceWorkType;
import java.math.BigDecimal;
import java.time.Instant;
public record ServicePerformanceImportView(Long id, ServicePerformanceWorkType workType, String constructionNo, String client, String serviceName,
 String serviceCategory, String detailField, BigDecimal serviceFeeThousand, String serviceStartDate,
 String serviceEndDate, BigDecimal shareRate, BigDecimal serviceAmountMillion, BigDecimal score,
 String evaluationEndDate, Instant uploadedAt, String uploadedBy) {}
