package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class G2bBidNoticeApiAdapterTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void 인증키를_정상적으로_인코딩하고_입찰공고를_도메인으로_변환한다() throws Exception {
        AtomicReference<String> rawQuery = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/getBidPblancListInfoServcPPSSrch", exchange -> {
            rawQuery.set(exchange.getRequestURI().getRawQuery());
            byte[] responseBody = """
                    {
                      "response": {
                        "header": {"resultCode": "00", "resultMsg": "정상"},
                        "body": {
                          "items": [{
                            "bidNtceNo": "R26PR00000001",
                            "bidNtceOrd": "00",
                            "ntceKindNm": "일반공고",
                            "bidNtceNm": "기술용역 테스트 입찰공고",
                            "ntceInsttNm": "서울특별시",
                            "cntrctCnclsMthdNm": "일반경쟁",
                            "srvceDivNm": "기술용역",
                            "prtcptLmtRgnCd": "11",
                            "cmmnSpldmdMethdNm": "공동수급협정서 제출",
                            "sucsfbidMthdNm": "협상에 의한 계약",
                            "indstrytyLmtYn": "Y",
                            "pubPrcrmntMidClsfcNm": "정보통신",
                            "pubPrcrmntClsfcNm": "정보시스템 개발",
                            "sucsfbidMthdAppStd": "협상에 의한 계약체결기준",
                            "bidNtceDate": "202610081000",
                            "bidClseDt": "202610101800",
                            "opengDt": "202610111000",
                            "bidNtceUrl": "https://www.g2b.go.kr/test"
                          }],
                          "numOfRows": 100,
                          "pageNo": 1,
                          "totalCount": 1
                        }
                      }
                    }
                    """.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json;charset=UTF-8");
            exchange.sendResponseHeaders(200, responseBody.length);
            exchange.getResponseBody().write(responseBody);
            exchange.close();
        });
        server.start();

        G2bBidNoticeApiProperties properties = new G2bBidNoticeApiProperties(
                "http://localhost:" + server.getAddress().getPort(),
                "test%2Fkey%2Bvalue%3D",
                Duration.ofSeconds(1),
                Duration.ofSeconds(3)
        );
        G2bBidNoticeApiConfig config = new G2bBidNoticeApiConfig();
        G2bBidNoticeApiAdapter adapter = new G2bBidNoticeApiAdapter(
                config.g2bRestClient(properties), properties, new G2bBidNoticeApiMapper());

        ZoneId zoneId = ZoneId.of("Asia/Seoul");
        G2bBidNoticePage result = adapter.load(new G2bBidNoticeQuery(
                ZonedDateTime.of(2026, 10, 8, 9, 0, 0, 0, zoneId),
                ZonedDateTime.of(2026, 10, 8, 11, 0, 0, 0, zoneId),
                List.of("00", "11"),
                1,
                100
        ));

        assertThat(rawQuery.get())
                .contains("serviceKey=test%2Fkey%2Bvalue%3D")
                .contains("inqryBgnDt=202610080900")
                .contains("inqryEndDt=202610081100")
                .contains("prtcptLmtRgnCd=00&prtcptLmtRgnCd=11")
                .contains("inqryDiv=1")
                .contains("type=json");
        assertThat(result.totalCount()).isEqualTo(1);
        assertThat(result.notices()).singleElement().satisfies(notice -> {
            assertThat(notice.bidNoticeNumber()).isEqualTo("R26PR00000001");
            assertThat(notice.noticeKindName()).isEqualTo("일반공고");
            assertThat(notice.contractConclusionMethodName()).isEqualTo("일반경쟁");
            assertThat(notice.serviceDivisionName()).isEqualTo("기술용역");
            assertThat(notice.participationLimitRegionCode()).isEqualTo("11");
            assertThat(notice.commonJointMethodName()).isEqualTo("공동수급협정서 제출");
            assertThat(notice.successfulBidMethodName()).isEqualTo("협상에 의한 계약");
            assertThat(notice.industryLimitYn()).isEqualTo("Y");
            assertThat(notice.publicProcurementMidClassificationName()).isEqualTo("정보통신");
            assertThat(notice.publicProcurementClassificationName()).isEqualTo("정보시스템 개발");
            assertThat(notice.successfulBidMethodApplicationStandard()).isEqualTo("협상에 의한 계약체결기준");
            assertThat(notice.rawPayload()).contains("bidNtceNo");
        });
    }
}
