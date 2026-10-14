package com.cheil.batch.g2bbidnotice.batch;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

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
            throw new IllegalArgumentException("batch.g2b.bid-notice.page-size??1 ??곴맒 999 ??꾨릭??鍮???몃빍??");
        }
        if (lookbackMinutes < 1) {
            throw new IllegalArgumentException("batch.g2b.bid-notice.lookback-minutes must be at least 1");
        }
        if (regionCodes != null && java.util.Arrays.stream(regionCodes.split(","))
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .anyMatch(code -> !"00".equals(code) && !"11".equals(code))) {
            throw new IllegalArgumentException("region-codes??00(?袁㏓럢) ?癒?뮉 11(??뽰뒻)筌??????????됰뮸??덈뼄.");
        }
    }

    public java.util.List<String> regionCodeList() {
        if (regionCodes == null || regionCodes.isBlank()) {
            // 筌왖???????곸뵠 ?袁⑷퍥 ?⑤벀?х몴?鈺곌퀬???롫뮉 API ?遺욧퍕????甕???묐뻬??몃빍??
            return java.util.List.of("");
        }
        return java.util.Arrays.stream(regionCodes.split(","))
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

    private java.util.Optional<ZonedDateTime> resolveDate(String value) {
        if (value == null || value.isBlank()) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyyMMddHHmm"))
                .atZone(ZoneId.of(zone)));
    }
}