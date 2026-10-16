package com.cheil.batch.g2bbidnotice.batch;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class G2bBidNoticeBatchPropertiesTest {

    @Test
    void resolvesLookbackWindowWhenExplicitDatesAreAbsent() {
        var properties = new G2bBidNoticeBatchProperties(
                true, false, "0 */10 8-23 * * *", "Asia/Seoul", Duration.ofMinutes(30), 999, 1440,
                "00,11", "", "", true
        );
        var now = ZonedDateTime.of(2026, 10, 14, 10, 0, 0, 0, ZoneId.of("Asia/Seoul"));

        assertThat(properties.resolveFrom(now)).isEqualTo(now.minusMinutes(1440));
        assertThat(properties.resolveTo(now)).isEqualTo(now);
        assertThat(properties.regionCodeList()).containsExactly("00", "11");
    }

    @Test
    void keepsConfiguredRegionCodesWithoutValidation() {
        var properties = new G2bBidNoticeBatchProperties(
                true, false, "*", "Asia/Seoul", Duration.ofMinutes(30), 100, 10,
                "26", "", "", true
        );

        assertThat(properties.regionCodeList()).containsExactly("26");
    }
}
