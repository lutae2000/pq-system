package com.cheil.batch.g2bbidnotice.application.model;

import java.time.ZonedDateTime;

/**
 * 나라장터 조달요청 조회 요청값입니다.
 *
 * <p>날짜는 애플리케이션 내부에서 {@link ZonedDateTime}으로 관리하고,
 * 외부 API 전송 시 {@code yyyyMMddHHmm} 형식으로 변환합니다.</p>
 */
public record G2bBidNoticeQuery(
        /** 조회 시작일시입니다. API 전송 형식은 yyyyMMddHHmm입니다. */
        ZonedDateTime from,
        /** 조회 종료일시입니다. API 전송 형식은 yyyyMMddHHmm입니다. */
        ZonedDateTime to,
        /** 참가제한지역코드입니다. 00은 전국, 11은 서울입니다. */
        String participationRegionCode,
        /** 조회할 페이지 번호입니다. 1부터 시작합니다. */
        int pageNumber,
        /** 한 페이지에 요청할 데이터 건수입니다. API 허용 범위 안에서 설정합니다. */
        int pageSize
) {
    public G2bBidNoticeQuery {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new IllegalArgumentException("조회 시작일시는 종료일시보다 이전이어야 합니다.");
        }
        if (pageNumber < 1) {
            throw new IllegalArgumentException("페이지 번호는 1 이상이어야 합니다.");
        }
        if (pageSize < 1 || pageSize > 999) {
            throw new IllegalArgumentException("페이지 크기는 1 이상 999 이하여야 합니다.");
        }
    }
}
