package com.cheil.cheil_be.adapter.in.web.workoverlapcontract;

import java.math.BigDecimal;

public record WorkOverlapContractSummaryResponse(
        long progressCount,
        long completedCount,
        long stoppedCount,
        long processedCount,
        long unprocessedCount,
        long contractCount,
        BigDecimal contractAmount
) {
}
