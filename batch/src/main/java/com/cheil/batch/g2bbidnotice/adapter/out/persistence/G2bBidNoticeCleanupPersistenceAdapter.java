package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import com.cheil.batch.g2bbidnotice.application.port.out.G2bBidNoticeCleanupPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class G2bBidNoticeCleanupPersistenceAdapter implements G2bBidNoticeCleanupPort {
    private final G2bBidNoticeCleanupMapper mapper;

    @Override
    public String findRetentionMonths() {
        return mapper.findRetentionMonths();
    }

    @Override
    public int deleteExpiredCandidates(int retentionMonths) {
        return mapper.deleteExpiredCandidates(retentionMonths);
    }

    @Override
    public int deleteExpiredSyncItems(int retentionMonths) {
        return mapper.deleteExpiredSyncItems(retentionMonths);
    }
}
