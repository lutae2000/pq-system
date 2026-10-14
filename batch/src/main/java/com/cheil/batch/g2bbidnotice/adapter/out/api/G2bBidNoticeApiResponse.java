package com.cheil.batch.g2bbidnotice.adapter.out.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import tools.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
record G2bBidNoticeApiResponse(Response response) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Response(
            /** API 처리 결과 코드와 메시지입니다. 정상 응답 코드는 00입니다. */
            Header header,
            /** 조회 결과 본문입니다. */
            Body body
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Header(
            /** API 처리 결과 코드입니다. 정상 응답은 00입니다. */
            String resultCode,
            /** API 처리 결과 메시지입니다. */
            String resultMsg
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Body(
            /** 나라장터 입찰공고 item 배열입니다. 원본 JSON 보존을 위해 JsonNode로 받습니다. */
            JsonNode items,
            /** 실제 응답된 페이지 건수입니다. */
            int numOfRows,
            /** 응답된 페이지 번호입니다. */
            int pageNo,
            /** 조회 조건에 해당하는 전체 데이터 건수입니다. */
            int totalCount
    ) {
    }
}
