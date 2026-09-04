package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

public record CompanyPerformanceDocumentTargetRequest(Long bidSeq, List<Long> companyPerformanceSeqs) {
}
