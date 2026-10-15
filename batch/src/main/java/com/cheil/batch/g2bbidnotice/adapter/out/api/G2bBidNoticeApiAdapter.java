package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.common.web.QueryStringBuilder;
import com.cheil.batch.g2bbidnotice.application.port.out.LoadG2bBidNoticesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticeSpecFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;
import tools.jackson.databind.JsonNode;

@Slf4j
@Component
@RequiredArgsConstructor
public class G2bBidNoticeApiAdapter implements LoadG2bBidNoticesPort {

    private static final String OPERATION_PATH = "/getBidPblancListInfoServcPPSSrch";
    private static final DateTimeFormatter QUERY_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
    private static final String SUCCESS_CODE = "00";

    @Qualifier("g2bRestClient")
    private final RestClient restClient;
    private final G2bBidNoticeApiProperties properties;

    @Override
    public G2bBidNoticePage load(G2bBidNoticeQuery query) {
        try {
            log.info("나라장터 API 요청: from={}, to={}, regionCodes={}, page={}, pageSize={}",
                    query.from(), query.to(), query.participationRegionCodes(), query.pageNumber(), query.pageSize());
            URI requestUri = buildRequestUri(query);
            log.info("나라장터 API 요청 URI: {}", maskServiceKey(requestUri));
            G2bBidNoticeApiResponse apiResponse = restClient.get()
                    .uri(requestUri)
                    .retrieve()
                    .body(G2bBidNoticeApiResponse.class);

            return mapResponse(apiResponse);
        } catch (G2bBidNoticeCommunicationException exception) {
            throw exception;
        } catch (RestClientException exception) {
            // 예외 원문에는 인증키가 포함된 요청 URL이 들어갈 수 있어 로그와 상위 예외에 포함하지 않습니다.
            log.warn("나라장터 API 통신 실패: errorType={}", exception.getClass().getSimpleName());
            throw new G2bBidNoticeCommunicationException("나라장터 용역 입찰공고 API 통신에 실패했습니다.");
        }
    }

    private G2bBidNoticePage mapResponse(G2bBidNoticeApiResponse apiResponse) {
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

        List<G2bBidNotice> notices = body.items() == null || !body.items().isArray()
                ? List.of()
                : toDomains(body.items());

        return new G2bBidNoticePage(body.pageNo(), body.numOfRows(), body.totalCount(), notices);
    }

    private List<G2bBidNotice> toDomains(JsonNode items) {
        List<G2bBidNotice> notices = new ArrayList<>();
        items.forEach(item -> notices.add(toDomain(item)));
        return List.copyOf(notices);
    }

    private G2bBidNotice toDomain(JsonNode item) {
        return new G2bBidNotice(
                text(item, "bidNtceNo"),
                text(item, "bidNtceOrd"),
                text(item, "befBidBbancNo"),
                text(item, "ntceKindNm"),
                text(item, "bidNtceNm"),
                text(item, "ntceInsttNm"),
                text(item, "dminsttNm"),
                text(item, "dminsttCd"),
                text(item, "cntrctCnclsMthdNm"),
                text(item, "srvceDivNm"),
                text(item, "prtcptLmtRgnCd"),
                text(item, "cmmnSpldmdMethdNm"),
                text(item, "sucsfbidMthdNm"),
                text(item, "indstrytyLmtYn"),
                text(item, "pubPrcrmntMidClsfcNm"),
                text(item, "pubPrcrmntClsfcNm"),
                text(item, "sucsfbidMthdAppStd"),
                text(item, "asignBdgtAmt"),
                text(item, "bidClseDt"),
                text(item, "opengDt"),
                text(item, "cmmnSpldmdAgrmntClseDt"),
                firstText(item, "bidNtceDate", "bidNtceDt"),
                text(item, "bidClseDt"),
                text(item, "opengDt"),
                firstText(item, "bidNtceUrl", "bidNtceDtlUrl"),
                specificationFiles(item),
                item.toString()
        );
    }

    private List<G2bBidNoticeSpecFile> specificationFiles(JsonNode item) {
        return IntStream.rangeClosed(1, 10)
                .mapToObj(sequence -> new G2bBidNoticeSpecFile(
                        sequence,
                        text(item, "ntceSpecFileNm" + sequence),
                        text(item, "ntceSpecDocUrl" + sequence)
                ))
                .filter(file -> (file.fileName() != null && !file.fileName().isBlank())
                        || (file.documentUrl() != null && !file.documentUrl().isBlank()))
                .toList();
    }

    private String firstText(JsonNode item, String... names) {
        for (String name : names) {
            String value = text(item, name);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String text(JsonNode item, String name) {
        JsonNode value = item.get(name);
        return value == null || value.isNull() ? null : value.asText();
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

    private String maskServiceKey(URI requestUri) {
        String query = requestUri.getRawQuery();
        if (query == null || query.isBlank()) {
            return requestUri.toString();
        }
        return requestUri.getRawPath() + "?" + query.replaceFirst("(^|&)serviceKey=[^&]*", "$1serviceKey=***");
    }
}
