package com.cheil.cheil_be.application.apilog.port.out;

import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;

/**
 * API 호출 이력을 저장하는 출력 포트입니다.
 */
public interface ApiCallLogRecorder {

    void record(ApiCallLogRecord record);
}
