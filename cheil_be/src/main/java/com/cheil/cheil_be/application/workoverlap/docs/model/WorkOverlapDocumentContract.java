package com.cheil.cheil_be.application.workoverlap.docs.model;

import java.math.BigDecimal;

public record WorkOverlapDocumentContract(
        String contractNo,
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
        String performanceCertification,
        String participateListDocument,
        String cemsConfirm,
        String remark,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId,
        String participationType,
        Boolean pqTargetYn,
        Integer remainDate,
        Boolean checkYn
) {
}
