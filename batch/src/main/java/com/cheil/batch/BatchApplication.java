package com.cheil.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
/**
 * 배치 애플리케이션의 Spring Boot 시작점입니다.
 *
 * <p>설정 프로퍼티를 자동으로 등록하고 스케줄링을 활성화합니다.</p>
 */
public class BatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(BatchApplication.class, args);
    }
}
