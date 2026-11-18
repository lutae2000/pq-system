package com.cheil.cheil_be.application.bidnotice.model;

import java.math.BigDecimal;

public record BidNoticeDashboardSummary(long bidCount, long successCount, BigDecimal designAmount) {
}
