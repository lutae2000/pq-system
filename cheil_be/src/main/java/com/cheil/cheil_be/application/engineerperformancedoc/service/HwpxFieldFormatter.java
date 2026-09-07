package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Set;
import java.util.List;

import org.springframework.util.StringUtils;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

final class HwpxFieldFormatter {

    record ContractPeriod(String fromDate, String toDate) {}

    private static final Set<String> PLAIN_PERIOD_FIELD_NAMES = Set.of(
            "근무일(일)",
            "근무일(월)",
            "근무일(년월)",
            "참여일수(일)",
            "참여일수(월)",
            "참여일수(년)"
    );

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
            boolean ownAmountFirst = label.indexOf("당사금액") < label.indexOf("총계약금액");
            BigDecimal primaryAmount = ownAmountFirst ? review.ownAmt() : review.contractAmt();
            BigDecimal secondaryAmount = ownAmountFirst ? review.contractAmt() : review.ownAmt();
            return formatAmount(primaryAmount, label) + "\n(" + formatAmount(secondaryAmount, label) + ")";
        }
        if (label.contains("총계약금액")) {
            return formatAmount(review.contractAmt(), label);
        }
        if (label.contains("당사금액")) {
            return formatAmount(review.ownAmt(), label);
        }
        if (label.contains("PQ당사지분율")) {
            return formatDivisionRate(review.divisionRate(), label);
        }
        if (label.contains("용역시작일")) {
            return formatDate(review.contractFromDate(), label);
        }
        if (label.contains("용역종료일")) {
            return formatDate(review.contractToDate(), label);
        }
        if (label.contains("참여시작일")) {
            return formatDate(review.startDate(), label);
        }
        if (label.contains("참여종료일")) {
            return formatDate(review.endDate(), label);
        }
        if (label.contains("용역일수")) {
            return formatPeriod(review.contractFromDate(), review.contractToDate(), label, true);
        }
        if (label.contains("참여일수")) {
            return formatPeriod(review.startDate(), review.endDate(), label, true);
        }
        if (label.contains("선택기간")) {
            return formatDayCount(review.selectDay(), label);
        }
        if (label.contains("분야기간")) {
            return formatDayCount(review.partDay(), label);
        }
        return null;
    }

    static String formatContractPeriods(String fieldName, List<ContractPeriod> periods) {
        return formatPeriodList(fieldName, periods, "용역차수기간");
    }

    static String formatParticipationPeriods(String fieldName, List<ContractPeriod> periods) {
        return formatPeriodList(fieldName, periods, "참여차수기간");
    }

    static String formatCurrentEmploymentPeriod(String fieldName, String entryDate) {
        if (!StringUtils.hasText(fieldName)) return "";
        LocalDate entry = parseDate(entryDate);
        return entry == null ? "" : entry.format(dateFormatter(normalizeFieldName(fieldName))) + ".~ 근  무  중";
    }

    private static String formatPeriodList(String fieldName, List<ContractPeriod> periods, String fieldPrefix) {
        if (!StringUtils.hasText(fieldName) || periods == null || periods.isEmpty()) return "";
        String label = normalizeFieldName(fieldName);
        if (!label.contains(fieldPrefix)) return "";
        DateTimeFormatter formatter = dateFormatter(label);
        long totalDays = 0L;
        String totalUnit = totalUnit(label);
        StringBuilder value = new StringBuilder();
        for (ContractPeriod period : periods) {
            LocalDate from = parseDate(period.fromDate());
            LocalDate to = parseDate(period.toDate());
            if (from == null || to == null || to.isBefore(from)) continue;
            long days = ChronoUnit.DAYS.between(from, to) + 1;
            totalDays += days;
            if (value.length() > 0) value.append("\n\n");
            value.append(from.format(formatter)).append("\n~\n")
                    .append(to.format(formatter)).append("\n(")
                    .append(formatPeriodDays(days, totalUnit))
                    .append(periodUnitLabel(totalUnit)).append(")");
        }
        if (value.length() == 0) return "";
        return value.append("\n\n(총 ")
                .append(formatPeriodDays(totalDays, totalUnit))
                .append(periodUnitLabel(totalUnit)).append(")").toString();
    }

    private static String totalUnit(String label) {
        if (label.contains("(총일)")) return "일";
        if (label.contains("(총년)")) return "년";
        return "월";
    }

    private static String formatPeriodDays(long days, String unit) {
        if ("일".equals(unit)) return formatNumber(days);
        BigDecimal divisor = "년".equals(unit) ? BigDecimal.valueOf(365L) : BigDecimal.valueOf(30L);
        return BigDecimal.valueOf(days).divide(divisor, 2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String periodUnitLabel(String unit) {
        return "일".equals(unit) ? "일" : unit;
    }

    static String format(String fieldName, EngineerDtos.Career history) {
        if (!StringUtils.hasText(fieldName) || history == null) {
            return null;
        }

        String label = normalizeFieldName(fieldName);
        if (label.contains("입사일")) {
            return formatDate(history.entryDt(), label);
        }
        if (label.contains("퇴사일")) {
            return formatDate(history.retireDt(), label);
        }
        if (label.contains("근무일") || label.contains("근무기간")) {
            return formatPeriod(history.entryDt(), history.retireDt(), label, true);
        }
        return null;
    }

    static String formatBirthDate(String fieldName, String birthday) {
        return formatBirthDateWithAge(fieldName, birthday, "");
    }

    static String formatBirthDateWithAge(String fieldName, String birthday, String age) {
        if (!StringUtils.hasText(fieldName) || !StringUtils.hasText(birthday)) {
            return "";
        }
        String label = normalizeFieldName(fieldName);
        if (!label.contains("생년월일")) return birthday;
        String formattedDate = formatDate(birthday, label);
        String result = label.contains("(만나이)") && StringUtils.hasText(age)
                ? formattedDate + "\n(" + age + ")"
                : formattedDate;
        return fieldName.toLowerCase(Locale.ROOT).contains("xx")
                ? result.replaceAll("\\R", "")
                : result;
    }

    private static String normalizeFieldName(String fieldName) {
        String label = fieldName.trim();
        label = label.replaceAll("(?i)xx", "").trim();
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

    private static String formatDivisionRate(BigDecimal divisionRate, String label) {
        if (divisionRate == null) {
            return "";
        }
        BigDecimal value = label.contains("(0.00%)")
                ? divisionRate.movePointLeft(2)
                : divisionRate;
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    static String formatDate(String value, String label) {
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
            return PLAIN_PERIOD_FIELD_NAMES.contains(label) ? duration : duration.isEmpty() ? "" : "(" + duration + ")";
        }

        DateTimeFormatter formatter = dateFormatter(label);
        String period = from.format(formatter) + " ~ " + to.format(formatter);
        return duration.isEmpty() ? period : period + " (" + duration + ")";
    }

    private static String formatDayCount(Integer dayCount, String label) {
        return dayCount == null ? "" : formatDuration(dayCount.longValue(), label);
    }

    private static String formatDuration(long days, String label) {
        if (label.contains("(일)")) {
            return formatNumber(days) + (hasDateFormat(label) ? "일" : "");
        }
        if (label.contains("(월)")) {
            BigDecimal months = BigDecimal.valueOf(days)
                    .divide(BigDecimal.valueOf(30L), 2, RoundingMode.HALF_UP)
                    .stripTrailingZeros();
            return months.toPlainString() + (hasDateFormat(label) ? "개월" : "");
        }
        if (label.contains("(년)")) {
            BigDecimal years = BigDecimal.valueOf(days).divide(BigDecimal.valueOf(365L), 2, RoundingMode.HALF_UP);
            return years.toPlainString() + (hasDateFormat(label) ? "년" : "");
        }
        if (label.contains("(년월)")) {
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
                || label.contains("yy-mm-dd")
                || label.contains("yy.mm.dd")
                || label.contains("yyyy.mm.dd")
                || label.contains("yyyy-mm")
                || label.contains("yy-mm")
                || label.contains("yy년mm월")
                || label.contains("yyyy년mm월");
    }

    private static DateTimeFormatter dateFormatter(String label) {
        if (label.contains("yyyy\uB144MM\uC6D4")) {
            return DateTimeFormatter.ofPattern("yyyy'\uB144'MM'\uC6D4'");
        }
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
        if (label.contains("yy-mm-dd")) {
            return DateTimeFormatter.ofPattern("yy-MM-dd");
        }
        if (label.contains("yyyy-mm")) {
            return DateTimeFormatter.ofPattern("yyyy-MM");
        }
        if (label.contains("yy-mm")) {
            return DateTimeFormatter.ofPattern("yy-MM");
        }
        if (label.contains("yy년mm월")) {
            return DateTimeFormatter.ofPattern("yy년MM월");
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
