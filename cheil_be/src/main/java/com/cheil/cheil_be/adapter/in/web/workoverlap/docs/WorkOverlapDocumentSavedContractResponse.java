package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapEngineerContractResponse;

public record WorkOverlapDocumentSavedContractResponse(
        Long targetId,
        Integer displayOrder,
        String responsibility,
        WorkOverlapEngineerContractResponse contract
) {
}
