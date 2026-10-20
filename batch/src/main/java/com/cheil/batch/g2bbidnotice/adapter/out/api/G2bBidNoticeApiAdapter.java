package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.cheil.batch.common.util.QueryStringBuilder;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.application.port.out.LoadG2bBidNoticesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
/** 나라장터 외부 API를 호출하고 응답 형식을 검증하는 출력 어댑터입니다. */
public class G2bBidNoticeApiAdapter implements LoadG2bBidNoticesPort {

    private static final String OPERATION_PATH = "/getBidPblancListInfoServcPPSSrch";
    private static final DateTimeFormatter QUERY_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
    private static final String SUCCESS_CODE = "00";

    private final RestClient restClient;
    private final G2bBidNoticeApiProperties properties;
    private final G2bBidNoticeApiMapper mapper;

    public G2bBidNoticeApiAdapter(
            @Qualifier("g2bRestClient") RestClient restClient,
            G2bBidNoticeApiProperties properties,
            G2bBidNoticeApiMapper mapper
    ) {
        this.restClient = restClient;
        this.properties = properties;
        this.mapper = mapper;
    }

    @Override
    public G2bBidNoticePage load(G2bBidNoticeQuery query) {
        URI requestUri = null;
        try {
            log.info("나라장터 API 요청: from={}, to={}, regionCodes={}, page={}, pageSize={}",
                    query.from(), query.to(), query.participationRegionCodes(), query.pageNumber(), query.pageSize());
            requestUri = buildRequestUri(query);
            log.info("나라장터 API 요청 URI: {}", requestUri);
            G2bBidNoticeApiResponse apiResponse = restClient.get()
                    .uri(requestUri)
                    .retrieve()
                    .body(G2bBidNoticeApiResponse.class);

            return mapResponse(apiResponse);
        } catch (G2bBidNoticeCommunicationException exception) {
            throw exception;
        } catch (RestClientException exception) {
            // 예외 원문에는 인증키가 포함된 요청 URL이 들어갈 수 있어 로그와 상위 예외에 포함하지 않습니다.
            log.warn(
                    "나라장터 API 통신 실패: errorType={}, message={}, uri={}",
                    exception.getClass().getSimpleName(),
                    exception.getMessage(),
                    requestUri == null ? "-" : requestUri,
                    exception
            );
            throw new G2bBidNoticeCommunicationException("나라장터 용역 입찰공고 API 통신에 실패했습니다.", exception);
        }
    }

    private G2bBidNoticePage mapResponse(G2bBidNoticeApiResponse apiResponse) {
        // 통신 성공과 API 업무 응답 성공을 구분해 모두 검증합니다.
        if (apiResponse == null || apiResponse.response() == null || apiResponse.response().header() == null) {
            throw new G2bBidNoticeCommunicationException("나라장터 API 응답 형식이 올바르지 않습니다.");
        }

        G2bBidNoticeApiResponse.Header header = apiResponse.response().header();
        if (!SUCCESS_CODE.equals(header.resultCode())) {
            throw new G2bBidNoticeCommunicationException(
                    "나라장터 API가 오류를 반환했습니다. resultCode=%s, resultMsg=%s"
                            .formatted(header.resultCode(), header.resultMsg())
            );
        }

        G2bBidNoticeApiResponse.Body body = apiResponse.response().body();
        if (body == null) {
            return new G2bBidNoticePage(1, 0, 0, List.of());
        }

        var notices = mapper.toDomains(body.items());

        return new G2bBidNoticePage(body.pageNo(), body.numOfRows(), body.totalCount(), notices);
    }

    /**
     * 나라장터 용역 입찰공고목록 API의 요청값을 URI 쿼리 파라미터로 구성합니다.
     *
     * <ul>
     *     <li>serviceKey: 공공데이터포털 인증키</li>
     *     <li>pageNo: 페이지 번호</li>
     *     <li>numOfRows: 한 페이지 조회 건수</li>
     *     <li>inqryDiv: 조회구분. 1은 입력일시 기준 조회입니다.</li>
     *     <li>inqryBgnDt, inqryEndDt: 조회 시작·종료일시(yyyyMMddHHmm)</li>
     *     <li>type: 응답 형식(json)</li>
     * </ul>
     */
    private URI buildRequestUri(G2bBidNoticeQuery query) {
        String baseUrl = properties.baseUrl().replaceAll("/+$", "");
        String queryString = new QueryStringBuilder()
                .add("serviceKey", decodeServiceKey(properties.serviceKey()))
                .add("pageNo", query.pageNumber())
                .add("numOfRows", query.pageSize())
                .add("inqryDiv", 1)
                .add("inqryBgnDt", QUERY_DATE_TIME_FORMATTER.format(query.from()))
                .add("inqryEndDt", QUERY_DATE_TIME_FORMATTER.format(query.to()))
                .add("type", "json")
                .addAll("prtcptLmtRgnCd", query.participationRegionCodes())
                .build();
        return URI.create(baseUrl + OPERATION_PATH + "?" + queryString);
    }

    private String decodeServiceKey(String serviceKey) {
        // 공공데이터포털은 인코딩 키와 디코딩 키를 모두 제공하므로 어떤 값을 설정해도 동일하게 전송합니다.
        String decodedKey = serviceKey.contains("%")
                ? URLDecoder.decode(serviceKey, StandardCharsets.UTF_8)
                : serviceKey;
        return decodedKey;
    }

}
