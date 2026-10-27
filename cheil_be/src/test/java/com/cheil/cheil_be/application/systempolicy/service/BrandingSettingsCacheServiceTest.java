package com.cheil.cheil_be.application.systempolicy.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.RedisSerializer;

class BrandingSettingsCacheServiceTest {

    @Test
    void brandingSettingsSurviveValkeyJsonSerialization() {
        BrandingAssetService.BrandingSettings settings = new BrandingAssetService.BrandingSettings(
                "/branding/background.png", "/branding/logo.png", "/branding/favicon.png"
        );
        RedisSerializer<Object> serializer = RedisSerializer.json();

        assertThat(serializer.deserialize(serializer.serialize(settings))).isEqualTo(settings);
    }
}
