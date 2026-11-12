package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.job.Job;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class G2bBidNoticeCleanupScheduler {
    private final Job g2bBidNoticeCleanupJob;
    private final BatchJobRunner runner;

    @Value("${batch.cleanup.g2b-bid-notices.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${batch.cleanup.g2b-bid-notices.cron}", zone = "${batch.cleanup.g2b-bid-notices.zone:Asia/Seoul}")
    public void run() {
        if (enabled) {
            runner.run(g2bBidNoticeCleanupJob);
        }
    }
}
