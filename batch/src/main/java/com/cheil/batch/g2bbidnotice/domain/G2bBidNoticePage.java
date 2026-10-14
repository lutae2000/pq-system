package com.cheil.batch.g2bbidnotice.domain;

import java.util.List;

/**
 * 나라장터 조회 결과입니다.
 */
public record G2bBidNoticePage(
        int pageNumber,
        int pageSize,
        int totalCount,
        List<G2bBidNotice> notices
) {
    public G2bBidNoticePage {
        notices = notices == null ? List.of() : List.copyOf(notices);
    }
}
