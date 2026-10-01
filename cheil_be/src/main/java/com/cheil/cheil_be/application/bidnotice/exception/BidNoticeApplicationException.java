package com.cheil.cheil_be.application.bidnotice.exception;

/**
 * 입찰 공고 use case에서 발생한 애플리케이션 오류입니다.
 * HTTP 상태 코드는 inbound adapter가 이 오류 유형을 기준으로 변환합니다.
 */
public class BidNoticeApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public BidNoticeApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
