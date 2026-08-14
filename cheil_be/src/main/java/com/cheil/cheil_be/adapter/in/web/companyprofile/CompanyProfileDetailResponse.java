package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.util.List;

public record CompanyProfileDetailResponse(
        CompanyProfileResponse profile,
        List<CompanyFinancialStatusResponse> financialStatuses,
        List<CompanyAttachmentResponse> attachments,
        List<CompanyProfileHistoryResponse> histories
) {
}
