package com.cheil.cheil_be.domain.g2bbidnotice;

/** 나라장터 공고문에 연결된 첨부파일 정보다. */
public record G2bBidNoticeCandidateAttachment(
        String fileName,
        String downloadUrl
) {
}
