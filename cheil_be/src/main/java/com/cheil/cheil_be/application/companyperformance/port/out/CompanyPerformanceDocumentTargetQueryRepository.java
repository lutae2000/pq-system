package com.cheil.cheil_be.application.companyperformance.port.out;

import java.util.List;

public interface CompanyPerformanceDocumentTargetQueryRepository {

    List<Long> findUnselectedPerformanceSeqs(
            Long bidSeq,
            List<Condition> conditions
    );

    record Condition(
            String conditionType,
            String logicalOperator,
            String level1Code,
            String level2Code,
            String level3Code,
            String generalCode,
            String outlineCategoryCode,
            String outlineSubcategoryCode,
            String operator,
            String value,
            String valueTo,
            String valueType
    ) {
    }
}
