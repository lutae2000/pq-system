package com.cheil.cheil_be.application.serviceperformance.model;
import java.math.BigDecimal;
public record ServicePerformanceImportRow(String constructionNo, String client, String serviceName,
 String serviceCategory, String detailField, BigDecimal serviceFeeThousand, String serviceStartDate,
 String serviceEndDate, BigDecimal shareRate, BigDecimal serviceAmountMillion, BigDecimal score,
 String evaluationEndDate) {}
