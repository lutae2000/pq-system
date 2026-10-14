package com.cheil.batch.g2bbidnotice.domain;

/** 나라장터 공고문 첨부 파일명과 다운로드 URL입니다. */
public record G2bBidNoticeSpecFile(
        int sequence,
        String fileName,
        String documentUrl
) {
}
