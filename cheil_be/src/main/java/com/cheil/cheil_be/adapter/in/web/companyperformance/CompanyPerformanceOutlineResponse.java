package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceOutlineResponse(
        Long id,
        Long seq,
        Integer outlineGroupSeq,
        Integer outlineLineSeq,
        String categoryCode,
        String subcategoryCode,
        String categoryName,
        String subcategoryName,
        String subcategoryUnit,
        String outlineContent,
        String ddlbYn,
        String ddlbGroupCode,
        Integer sortSeq
) {
}
