package com.cheil.cheil_be.config.cache;

import java.time.Duration;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.cheil.cheil_be.config.commoncode.AppCommonCodeCacheProperties;
import com.cheil.cheil_be.config.commondepartment.AppDepartmentCacheProperties;
import com.cheil.cheil_be.config.systempolicy.AppSystemPolicyCacheProperties;

@Slf4j
@Configuration
@EnableCaching
public class ValkeyCacheConfig implements CachingConfigurer {

    private static final Duration DEFAULT_TTL = Duration.ofHours(1);
    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            AppCommonCodeCacheProperties commonCodeProperties,
            AppDepartmentCacheProperties departmentProperties,
            AppSystemPolicyCacheProperties systemPolicyProperties
    ) {
        RedisCacheConfiguration defaults = cacheConfiguration(DEFAULT_TTL);
        Map<String, RedisCacheConfiguration> cacheConfigurations = Map.of(
                "commonCodeById", cacheConfiguration(commonCodeProperties.ttl()),
                "commonCodeLevel1", cacheConfiguration(commonCodeProperties.ttl()),
                "commonCodeLevel2", cacheConfiguration(commonCodeProperties.ttl()),
                "departments", cacheConfiguration(departmentProperties.ttl()),
                "departmentByCode", cacheConfiguration(departmentProperties.ttl()),
                "systemNotices", cacheConfiguration(DEFAULT_TTL),
                "systemPolicies", cacheConfiguration(systemPolicyProperties.ttl())
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }

    @Bean
    public CacheErrorHandler cacheErrorHandler() {
        return new ValkeyCacheErrorHandler();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return cacheErrorHandler();
    }

    private RedisCacheConfiguration cacheConfiguration(Duration ttl) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                .disableCachingNullValues()
                .disableKeyPrefix()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        RedisSerializer.json()));
    }

    private static final class ValkeyCacheErrorHandler implements CacheErrorHandler {

        @Override
        public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
            log.debug("Valkey cache get failed. cache={}, key={}", cache.getName(), key, exception);
        }

        @Override
        public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
            log.debug("Valkey cache put failed. cache={}, key={}", cache.getName(), key, exception);
        }

        @Override
        public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
            log.debug("Valkey cache evict failed. cache={}, key={}", cache.getName(), key, exception);
        }

        @Override
        public void handleCacheClearError(RuntimeException exception, Cache cache) {
            log.debug("Valkey cache clear failed. cache={}", cache.getName(), exception);
        }
    }
}
