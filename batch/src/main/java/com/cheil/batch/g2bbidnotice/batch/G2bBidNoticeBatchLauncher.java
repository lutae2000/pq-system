package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import com.cheil.batch.common.batch.StartupBatchJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 나라장터 입찰공고 Job의 정기 실행과 개발용 기동 실행 설정을 담당합니다.
 */
@Slf4j
@Component
public class G2bBidNoticeBatchLauncher implements StartupBatchJob {

    private final Job job;
    private final BatchJobRunner batchJobRunner;
    private final G2bBidNoticeBatchProperties properties;

    public G2bBidNoticeBatchLauncher(
            @Qualifier("g2bBidNoticeCandidateSyncJob") Job job,
            BatchJobRunner batchJobRunner,
            G2bBidNoticeBatchProperties properties
    ) {
        this.job = job;
        this.batchJobRunner = batchJobRunner;
        this.properties = properties;
    }

    @Scheduled(
            cron = "${batch.g2b.bid-notice.cron}",
            zone = "${batch.g2b.bid-notice.zone:Asia/Seoul}"
    )
    public void runOnSchedule() {
        if (!properties.enabled()) {
            log.debug("나라장터 용역 입찰공고 정기 배치가 비활성화되어 있습니다.");
            return;
        }

        batchJobRunner.run(job, jobName());
    }

    @Override
    public String jobName() {
        return G2bBidNoticeBatchConfig.JOB_NAME;
    }

    @Override
    public Job job() {
        return job;
    }

    @Override
    public boolean runOnStartup() {
        return properties.enabled() && properties.runOnStartup();
    }
}
