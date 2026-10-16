package com.cheil.batch.apicalllogcleanup.application.service;

import com.cheil.batch.apicalllogcleanup.application.port.in.CleanupApiCallLogsUseCase;
import com.cheil.batch.apicalllogcleanup.application.port.out.DeleteExpiredApiCallLogsPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
/** API 호출 로그 정리 요청의 입력값을 검증하고 삭제 Port를 호출합니다. */
public class ApiCallLogCleanupService implements CleanupApiCallLogsUseCase {
    private final DeleteExpiredApiCallLogsPort deleteExpiredApiCallLogsPort;

    @Override
    public int cleanup(int retentionMonths) {
        // 보관 기간이 0 이하이면 전체 로그 삭제로 해석될 수 있으므로 거부합니다.
        if (retentionMonths < 1) {
            throw new IllegalArgumentException("retentionMonths must be at least 1");
        }
        return deleteExpiredApiCallLogsPort.deleteExpired(retentionMonths);
    }
}
