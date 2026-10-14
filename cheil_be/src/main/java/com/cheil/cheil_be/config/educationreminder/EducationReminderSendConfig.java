package com.cheil.cheil_be.config.educationreminder;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

@Configuration
public class EducationReminderSendConfig {

    @Bean
    public RestClient munjaNaraRestClient(AppEducationReminderSendProperties properties) {
        String endpointUrl = properties.munjanara() == null ? "https://munjanara.co.kr/send.sys" : properties.munjanara().endpointUrl();
        return RestClient.builder()
                .baseUrl(endpointUrl)
                .defaultHeaders(headers -> {
                    headers.set(HttpHeaders.ACCEPT_LANGUAGE, "ko");
                    headers.setAccept(java.util.List.of(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8)));
                    headers.setAcceptCharset(java.util.List.of(StandardCharsets.UTF_8));
                })
                .build();
    }

    @Bean(name = "educationReminderSendExecutor")
    public TaskExecutor educationReminderSendExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("education-reminder-send-");
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
