package com.cheil.cheil_be.application.engineer;

import java.util.List;
import java.util.Map;

public final class EngineerPdfExtractionDtos {

    private EngineerPdfExtractionDtos() {
    }

    public record Basic(
            String name,
            String birthDate,
            String workField,
            String specialtyField,
            String designGrade,
            String constructionManagementGrade
    ) {
    }

    public record Row(
            int rowNumber,
            Map<String, String> values,
            double confidence
    ) {
    }

    public record Response(
            String fileName,
            Basic basic,
            Map<String, List<Row>> sections,
            String extractedText,
            List<String> warnings
    ) {
    }
}
