package com.cheil.cheil_be.adapter.in.web.serviceperformance;
import java.math.BigDecimal;
import java.time.Instant;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportView;
public record ServicePerformanceImportResponse(Long id,String constructionNo,String client,String serviceName,
 String serviceCategory,String detailField,BigDecimal serviceFeeThousand,String serviceStartDate,
 String serviceEndDate,BigDecimal shareRate,BigDecimal serviceAmountMillion,BigDecimal score,String evaluationEndDate,Instant uploadedAt,String uploadedBy) {
 public static ServicePerformanceImportResponse from(ServicePerformanceImportView v) {
  return new ServicePerformanceImportResponse(v.id(),v.constructionNo(),v.client(),v.serviceName(),
   v.serviceCategory(),v.detailField(),v.serviceFeeThousand(),v.serviceStartDate(),v.serviceEndDate(),
   v.shareRate(),v.serviceAmountMillion(),v.score(),v.evaluationEndDate(),v.uploadedAt(),v.uploadedBy());
 }
}
