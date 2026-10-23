package com.cheil.batch.adapter.in.web;

import com.cheil.batch.config.BatchInternalProperties;
import com.cheil.batch.common.batch.BatchRunStatus;
import com.cheil.batch.g2bbidnotice.application.port.in.RunG2bBidNoticeBatchUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/batch")
@RequiredArgsConstructor
/** 인증된 내부 요청으로 나라장터 후보 동기화 배치를 수동 실행합니다. */
public class G2bBidNoticeBatchController {

    private static final String API_KEY_HEADER = "X-Batch-Api-Key";

    private final RunG2bBidNoticeBatchUseCase runUseCase;
    private final BatchInternalProperties properties;

    @PostMapping("/g2b-bid-notice-candidate-sync")
    public ResponseEntity<BatchRunResponse> run(
            @RequestHeader(value = API_KEY_HEADER, required = false) String apiKey
    ) {
        // 내부 호출용 API Key가 설정된 경우에만 요청 헤더를 검증합니다.
        if (StringUtils.hasText(properties.apiKey()) && !properties.apiKey().equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BatchRunResponse("UNAUTHORIZED", "배치 실행 인증에 실패했습니다."));
        }

        // 스케줄 실행과 같은 UseCase를 호출하므로 분산 락과 중복 실행 방지가 동일하게 적용됩니다.
        BatchRunStatus status = runUseCase.runOnDemand();
        HttpStatus httpStatus = switch (status) {
            case COMPLETED -> HttpStatus.OK;
            case SKIPPED -> HttpStatus.CONFLICT;
            case FAILED -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
        return ResponseEntity.status(httpStatus).body(new BatchRunResponse(status.name(), message(status)));
    }

    private String message(BatchRunStatus status) {
        return switch (status) {
            case COMPLETED -> "나라장터 용역 API 조회가 완료되었습니다.";
            case SKIPPED -> "다른 사용자가 나라장터 용역 API를 조회 중입니다.";
            case FAILED -> "나라장터 용역 API 조회에 실패했습니다.";
        };
    }

    public record BatchRunResponse(String status, String message) {
    }
}
