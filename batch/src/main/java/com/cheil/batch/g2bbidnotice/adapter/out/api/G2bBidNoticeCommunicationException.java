package com.cheil.batch.g2bbidnotice.adapter.out.api;

/**
 * 나라장터 API 통신 또는 응답 검증에 실패했을 때 발생합니다.
 */
public class G2bBidNoticeCommunicationException extends RuntimeException {

    public G2bBidNoticeCommunicationException(String message) {
        super(message);
    }

    public G2bBidNoticeCommunicationException(String message, Throwable cause) {
        super(message, cause);
    }
}
