package com.cheil.cheil_be.common.security;

import lombok.experimental.UtilityClass;

/**
 * 서비스 인증과 로그인 세션에 사용하는 HTTP 헤더 이름을 모아 둔 상수 유틸입니다.
 * <p>
 * 헤더 문자열을 여기서만 관리하면 컨트롤러, 필터, 테스트에서 이름이 어긋나는 일을 줄일 수 있습니다.
 */
@UtilityClass
public class SecurityHeaders {

    public static final String API_KEY = "x-api-key";
    public static final String AUTHORIZATION = "Authorization";
    public static final String SERVICE_ID = "x-service-id";
    public static final String LOGIN_ID = "x-login-id";
    public static final String PROGRAM_CODE = "x-program-code";
}
