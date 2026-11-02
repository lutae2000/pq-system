package com.cheil.cheil_be.adapter.in.web.serviceperformance;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportRow;
public record ServicePerformanceImportRequest(@NotBlank @Size(max=100) String constructionNo,
 @Size(max=300) String client, @NotBlank @Size(max=500) String serviceName,
 String serviceCategory, String detailField, @PositiveOrZero BigDecimal serviceFeeThousand,
 String serviceStartDate, String serviceEndDate, @PositiveOrZero BigDecimal shareRate,
 @PositiveOrZero BigDecimal serviceAmountMillion, @PositiveOrZero BigDecimal score,
 String evaluationEndDate) {
 public ServicePerformanceImportRow toRow() {
  return new ServicePerformanceImportRow(constructionNo,client,serviceName,serviceCategory,detailField,
   serviceFeeThousand,serviceStartDate,serviceEndDate,shareRate,serviceAmountMillion,score,evaluationEndDate);
 }
}
