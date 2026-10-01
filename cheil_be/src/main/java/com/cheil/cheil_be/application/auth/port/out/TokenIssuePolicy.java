package com.cheil.cheil_be.application.auth.port.out;

import java.time.Duration;

/**
 * 토큰 발급에 필요한 정책값을 제공하는 outbound port입니다.
 * 애플리케이션은 Spring 설정 객체의 구조를 알지 않고 이 계약만 사용합니다.
 */
public interface TokenIssuePolicy {

    String issuer();

    Duration ttl();
}
