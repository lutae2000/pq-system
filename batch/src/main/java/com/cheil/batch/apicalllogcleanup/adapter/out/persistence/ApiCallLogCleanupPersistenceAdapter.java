package com.cheil.batch.apicalllogcleanup.adapter.out.persistence;

import com.cheil.batch.apicalllogcleanup.application.port.out.DeleteExpiredApiCallLogsPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
/** API 호출 로그 삭제 Port를 JDBC Mapper에 연결하는 출력 어댑터입니다. */
public class ApiCallLogCleanupPersistenceAdapter implements DeleteExpiredApiCallLogsPort {

    private final ApiCallLogCleanupMapper mapper;

    @Override
    public int deleteExpired(int retentionMonths) {
        return mapper.deleteExpiredApiCallLogs(retentionMonths);
    }
}
