package com.cheil.cheil_be.config.batch;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class BatchIntegrationConfig {

    @Bean
    RestClient batchRestClient(AppBatchProperties properties) {
        return RestClient.builder().baseUrl(properties.url()).build();
    }
}
