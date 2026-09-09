package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;

import com.cheil.cheil_be.common.web.PageResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapEngineerContractResponse;

public record WorkOverlapDocumentEngineerContractsResponse(
        PageResponse<WorkOverlapEngineerContractResponse> availableContracts,
        List<WorkOverlapDocumentSavedContractResponse> savedContracts
) {
}
