package com.cheil.batch.g2bbidnotice.batch;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ConfigurationProperties(prefix = "batch.g2b.bid-notice")
public record G2bBidNoticeBatchProperties(
        boolean enabled,
        boolean runOnStartup,
        String cron,
        String zone,
        int pageSize,
        int lookbackMinutes,
        String regionCodes,
        String requestFrom,
        String requestTo,
        boolean includeUnrestricted
) {
    public G2bBidNoticeBatchProperties {
        if (pageSize < 1 || pageSize > 999) {
            throw new IllegalArgumentException("batch.g2b.bid-notice.page-size는 1 이상 999 이하여야 합니다.");
        }
        if (lookbackMinutes < 1) {
            throw new IllegalArgumentException("batch.g2b.bid-notice.lookback-minutes must be at least 1");
        }
    }

    public List<String> regionCodeList() {
        if (regionCodes == null || regionCodes.isBlank()) {
            // 지역 코드가 없으면 지역 제한 없이 조회하도록 빈 문자열을 API 파라미터로 사용합니다.
            return List.of("");
        }
        return Arrays.stream(regionCodes.split(","))
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .distinct()
                .toList();
    }

    public ZonedDateTime resolveFrom(ZonedDateTime now) {
        return resolveDate(requestFrom).orElseGet(() -> now.minusMinutes(lookbackMinutes));
    }

    public ZonedDateTime resolveTo(ZonedDateTime now) {
        return resolveDate(requestTo).orElse(now);
    }

    private Optional<ZonedDateTime> resolveDate(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                .atZone(ZoneId.of(zone)));
    }
}
