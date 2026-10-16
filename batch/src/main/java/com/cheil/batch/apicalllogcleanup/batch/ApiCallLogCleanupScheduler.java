package com.cheil.batch.apicalllogcleanup.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
/** API 호출 로그 보관 기간 정리 Job을 정해진 주기로 실행합니다. */
public class ApiCallLogCleanupScheduler {

    private final Job apiCallLogCleanupJob;
    private final BatchJobRunner batchJobRunner;

    @Value("${batch.cleanup.api-call-logs.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${batch.cleanup.api-call-logs.cron}", zone = "${batch.cleanup.api-call-logs.zone:Asia/Seoul}")
    public void run() {
        // 운영 환경별 enabled 설정으로 스케줄만 비활성화할 수 있습니다.
        if (!enabled) {
            log.debug("api_call_logs cleanup is disabled");
            return;
        }
        // 중복 실행 확인과 공통 메트릭 처리는 BatchJobRunner에 위임합니다.
        batchJobRunner.run(apiCallLogCleanupJob, "apiCallLogCleanupJob");
    }
}
