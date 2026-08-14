package com.cheil.cheil_be.config.aop;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * 컨트롤러 호출 로그 같은 @Aspect 기반 공통 기능을 활성화합니다.
 */
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig {
}
