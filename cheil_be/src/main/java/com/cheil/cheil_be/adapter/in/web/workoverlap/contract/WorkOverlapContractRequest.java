package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import java.math.BigDecimal;

public record WorkOverlapContractRequest(
        String serviceType,
        String clientName,
        String supervisingDepartmentCode,
        Boolean publicContractYn,
        String serviceName,
        String constructionStartDate,
        String constructionCompleteDate,
        String managementServiceCompleteDate,
        String constructionStopFromDate,
        String constructionStopToDate,
        String restartDate,
        BigDecimal contractAmount,
        BigDecimal shareAmount,
        String jointContractRatio,
        Boolean performanceCertification,
        Boolean participateListDocument,
        Boolean cemsConfirm,
        String remark,
        String periodChangeReason
) {
}
