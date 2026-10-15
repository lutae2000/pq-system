package com.cheil.cheil_be.adapter.out.integration.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.cheil.cheil_be.application.g2bbidnotice.model.G2bBidNoticeBatchTriggerResult;
import com.cheil.cheil_be.application.g2bbidnotice.port.out.G2bBidNoticeBatchTrigger;
import com.cheil.cheil_be.config.batch.AppBatchProperties;

@Component
@RequiredArgsConstructor
@Slf4j
public class G2bBidNoticeBatchHttpClient implements G2bBidNoticeBatchTrigger {

    private final RestClient batchRestClient;
    private final AppBatchProperties properties;

    @Override
    public G2bBidNoticeBatchTriggerResult trigger() {
        try {
            return batchRestClient.post()
                    .uri("/internal/batch/g2b-bid-notice-candidate-sync")
                    .header("X-Batch-Api-Key", properties.apiKey() == null ? "" : properties.apiKey())
                    .retrieve()
                    .body(BatchResponse.class)
                    .toResult();
        } catch (HttpClientErrorException.Conflict exception) {
            return new G2bBidNoticeBatchTriggerResult("SKIPPED", "다른 사용자가 나라장터 용역 API를 조회 중입니다.");
        } catch (RestClientException exception) {
            log.error("나라장터 용역 API 배치 실행 요청에 실패했습니다.", exception);
            return new G2bBidNoticeBatchTriggerResult("FAILED", "나라장터 용역 API 조회 요청에 실패했습니다.");
        }
    }

    private record BatchResponse(String status, String message) {
        private G2bBidNoticeBatchTriggerResult toResult() {
            return new G2bBidNoticeBatchTriggerResult(status, message);
        }
    }
}
