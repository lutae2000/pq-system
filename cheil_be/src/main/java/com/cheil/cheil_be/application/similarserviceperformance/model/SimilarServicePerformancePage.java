package com.cheil.cheil_be.application.similarserviceperformance.model;

import java.util.List;

public record SimilarServicePerformancePage(
        List<SimilarServicePerformance> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
