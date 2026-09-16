package com.cheil.cheil_be.application.workoverlap.docs.model;

public record WorkOverlapDocumentContractRow(
        Long targetId,
        Integer displayOrder,
        String responsibility,
        WorkOverlapDocumentContract contract
) {
}
