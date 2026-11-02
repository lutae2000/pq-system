package com.cheil.cheil_be.application.serviceperformance.model;
import java.math.BigDecimal;
import java.time.Instant;
public record ServicePerformanceImportView(Long id, String constructionNo, String client, String serviceName,
 String serviceCategory, String detailField, BigDecimal serviceFeeThousand, String serviceStartDate,
 String serviceEndDate, BigDecimal shareRate, BigDecimal serviceAmountMillion, BigDecimal score,
 String evaluationEndDate, Instant uploadedAt, String uploadedBy) {}
