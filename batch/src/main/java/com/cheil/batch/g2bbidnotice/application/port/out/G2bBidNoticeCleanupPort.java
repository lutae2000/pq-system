package com.cheil.batch.g2bbidnotice.application.port.out;

public interface G2bBidNoticeCleanupPort {
    String findRetentionMonths();

    int deleteExpiredCandidates(int retentionMonths);

    int deleteExpiredSyncItems(int retentionMonths);
}
