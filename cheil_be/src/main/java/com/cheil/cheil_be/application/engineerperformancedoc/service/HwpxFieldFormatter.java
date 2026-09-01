package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

import org.springframework.util.StringUtils;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

final class HwpxFieldFormatter {

    private static final BigDecimal THOUSAND = BigDecimal.valueOf(1_000L);
    private static final BigDecimal TEN_THOUSAND = BigDecimal.valueOf(10_000L);
    private static final BigDecimal MILLION = BigDecimal.valueOf(1_000_000L);
    private static final BigDecimal HUNDRED_MILLION = BigDecimal.valueOf(100_000_000L);

    private HwpxFieldFormatter() {
    }

    static String format(String fieldName, EngineerProjectHistoryReviewResponse review) {
        if (!StringUtils.hasText(fieldName) || review == null) {
            return null;
        }

        String label = normalizeFieldName(fieldName);
        boolean hasContractAmount = label.contains("총계약금액");
        boolean hasOwnAmount = label.contains("당사금액");
        if (hasContractAmount && hasOwnAmount) {
            boolean ownAmountFirst = label.startsWith("당사금액");
            BigDecimal primaryAmount = ownAmountFirst ? review.ownAmt() : review.contractAmt();
            BigDecimal secondaryAmount = ownAmountFirst ? review.contractAmt() : review.ownAmt();
            return formatAmount(primaryAmount, label) + "\n(" + formatAmount(secondaryAmount, label) + ")";
        }
        if (label.startsWith("총계약금액")) {
            return formatAmount(review.contractAmt(), label);
        }
        if (label.startsWith("당사금액")) {
            return formatAmount(review.ownAmt(), label);
        }
        if (label.startsWith("용역시작일")) {
            return formatDate(review.contractFromDate(), label);
        }
        if (label.startsWith("용역종료일")) {
            return formatDate(review.contractToDate(), label);
        }
        if (label.startsWith("참여시작일")) {
            return formatDate(review.startDate(), label);
        }
        if (label.startsWith("참여종료일")) {
            return formatDate(review.endDate(), label);
        }
        if (label.startsWith("용역기간")) {
            return formatPeriod(review.contractFromDate(), review.contractToDate(), label, true);
        }
        if (label.startsWith("참여기간")) {
            return formatPeriod(review.startDate(), review.endDate(), label, true);
        }
        if (label.startsWith("선택기간")) {
            return formatDayCount(review.selectDay(), label);
        }
        if (label.startsWith("분야기간")) {
            return formatDayCount(review.partDay(), label);
        }
        return null;
    }

    static String format(String fieldName, EngineerDtos.Career history) {
        if (!StringUtils.hasText(fieldName) || history == null) {
            return null;
        }

        String label = normalizeFieldName(fieldName);
        if (label.startsWith("입사일")) {
            return formatDate(history.entryDt(), label);
        }
        if (label.startsWith("퇴사일")) {
            return formatDate(history.retireDt(), label);
        }
        if (label.startsWith("근무기간")) {
            return formatPeriod(history.entryDt(), history.retireDt(), label, false);
        }
        return null;
    }

    static String formatBirthDate(String fieldName, String birthday) {
        if (!StringUtils.hasText(fieldName) || !StringUtils.hasText(birthday)) {
            return "";
        }
        String label = normalizeFieldName(fieldName);
        return label.startsWith("생년월일") ? formatDate(birthday, label) : birthday;
    }

    private static String normalizeFieldName(String fieldName) {
        String label = fieldName.trim();
        if (label.startsWith("경력_")) {
            return label.substring("경력_".length());
        }
        if (label.startsWith("이력_")) return label.substring("이력_".length());
        return label.startsWith("기본_") ? label.substring("기본_".length()) : label;
    }

    private static String formatAmount(BigDecimal amount, String label) {
        if (amount == null) {
            return "";
        }

        BigDecimal divisor = BigDecimal.ONE;
        if (label.contains("(억)")) {
            divisor = HUNDRED_MILLION;
        } else if (label.contains("(백만)")) {
            divisor = MILLION;
        } else if (label.contains("(만)")) {
            divisor = TEN_THOUSAND;
        } else if (label.contains("(천)")) {
            divisor = THOUSAND;
        }

        BigDecimal converted = amount.divide(divisor, 0, RoundingMode.DOWN);
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(converted);
    }

    private static String formatDate(String value, String label) {
        LocalDate date = parseDate(value);
        if (date == null) {
            return "";
        }
        return date.format(dateFormatter(label));
    }

    private static String formatPeriod(String fromValue, String toValue, String label, boolean inclusive) {
        LocalDate from = parseDate(fromValue);
        LocalDate to = parseDate(toValue);
        if (from == null || to == null) {
            return "";
        }

        long days = ChronoUnit.DAYS.between(from, to) + (inclusive ? 1 : 0);
        boolean includesDateFormat = hasDateFormat(label);
        String duration = formatDuration(days, label);
        if (!includesDateFormat) {
            return duration;
        }

        DateTimeFormatter formatter = dateFormatter(label);
        String period = from.format(formatter) + " ~ " + to.format(formatter);
        return duration.isEmpty() ? period : period + " (" + duration + ")";
    }

    private static String formatDayCount(Integer dayCount, String label) {
        return dayCount == null ? "" : formatDuration(dayCount.longValue(), label);
    }

    private static String formatDuration(long days, String label) {
        if (label.endsWith("(일)")) {
            return formatNumber(days) + (hasDateFormat(label) ? "일" : "");
        }
        if (label.endsWith("(월)")) {
            long months = days / 30L;
            return formatNumber(months) + (hasDateFormat(label) ? "개월" : "");
        }
        if (label.endsWith("(년)")) {
            BigDecimal years = BigDecimal.valueOf(days).divide(BigDecimal.valueOf(365L), 2, RoundingMode.HALF_UP);
            return years.toPlainString() + (hasDateFormat(label) ? "년" : "");
        }
        if (label.endsWith("(년월)")) {
            long years = days / 365L;
            long months = days % 365L / 30L;
            return years > 0 ? years + "년 " + months + "개월" : months + "개월";
        }
        return "";
    }

    private static String formatNumber(long value) {
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(value);
    }

    private static boolean hasDateFormat(String label) {
        return label.contains("yyyy-mm-dd")
                || label.contains("yy.mm.dd")
                || label.contains("yyyy.mm.dd")
                || label.contains("yyyy-mm")
                || label.contains("yyyy년mm월");
    }

    private static DateTimeFormatter dateFormatter(String label) {
        if (label.contains("yyyy년mm월")) {
            return DateTimeFormatter.ofPattern("yyyy년MM월");
        }
        if (label.contains("yyyy.mm.dd")) {
            return DateTimeFormatter.ofPattern("yyyy.MM.dd");
        }
        if (label.contains("yy.mm.dd")) {
            return DateTimeFormatter.ofPattern("yy.MM.dd");
        }
        if (label.contains("yyyy-mm-dd")) {
            return DateTimeFormatter.ISO_LOCAL_DATE;
        }
        if (label.contains("yyyy-mm")) {
            return DateTimeFormatter.ofPattern("yyyy-MM");
        }
        return DateTimeFormatter.ISO_LOCAL_DATE;
    }

    private static LocalDate parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String digits = value.replaceAll("\\D", "");
        if (digits.length() != 8) {
            return null;
        }
        try {
            return LocalDate.parse(digits, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }
}
