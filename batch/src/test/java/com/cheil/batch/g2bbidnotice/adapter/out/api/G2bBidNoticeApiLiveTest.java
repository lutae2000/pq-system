package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 나라장터 운영 API와 실제 통신이 필요할 때만 실행하는 확인용 테스트입니다.
 * 일반 빌드에서는 외부 서비스 상태에 영향을 받지 않도록 비활성화됩니다.
 */
class G2bBidNoticeApiLiveTest {

    @Test
    @EnabledIfEnvironmentVariable(named = "G2B_LIVE_TEST", matches = "true")
    void 나라장터_용역_입찰공고_API와_통신한다() {
        String serviceKey = System.getenv("G2B_SERVICE_KEY");
        assertThat(serviceKey).as("G2B_SERVICE_KEY 환경변수").isNotBlank();

        G2bBidNoticeApiProperties properties = new G2bBidNoticeApiProperties(
                "https://apis.data.go.kr/1230000/ad/BidPublicInfoService",
                serviceKey,
                Duration.ofSeconds(5),
                Duration.ofSeconds(30)
        );
        G2bBidNoticeApiConfig config = new G2bBidNoticeApiConfig();
        G2bBidNoticeApiAdapter adapter = new G2bBidNoticeApiAdapter(config.g2bRestClient(properties), properties);

        ZonedDateTime to = ZonedDateTime.now(ZoneId.of("Asia/Seoul"));
        G2bBidNoticePage result = adapter.load(new G2bBidNoticeQuery(to.minusHours(2), to, List.of("11"), 1, 10));

        assertThat(result.pageNumber()).isEqualTo(1);
        assertThat(result.totalCount()).isGreaterThanOrEqualTo(result.notices().size());
    }
}
