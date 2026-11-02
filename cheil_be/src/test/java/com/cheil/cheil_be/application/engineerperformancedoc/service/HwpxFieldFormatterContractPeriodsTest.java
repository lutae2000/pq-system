package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class HwpxFieldFormatterContractPeriodsTest {

    @Test
    void formatsAllCompanyContractPeriodFieldVariants() {
        var periods = List.of(
                new HwpxFieldFormatter.ContractPeriod("20240101", "20240131"),
                new HwpxFieldFormatter.ContractPeriod("20240201", "20240229"));
        var dateFormats = List.of(
                new String[] {"yy.mm.dd", "24.01.01", "24.02.29"},
                new String[] {"yyyy.mm.dd", "2024.01.01", "2024.02.29"},
                new String[] {"yyyy-mm-dd", "2024-01-01", "2024-02-29"},
                new String[] {"yyyy-mm", "2024-01", "2024-02"},
                new String[] {"yyyy년mm월", "2024년01월", "2024년02월"});
        var units = List.of(
                new String[] {"일", "총일", "31일", "60일"},
                new String[] {"월", "총월", "1.03개월", "2.00개월"},
                new String[] {"년", "총년", "0.08년", "0.16년"});

        for (String[] dateFormat : dateFormats) {
            for (String[] unit : units) {
                String fieldName = "경력_용역차수기간(" + dateFormat[0] + ")(" + unit[0] + ")(" + unit[1] + ")";
                String value = HwpxFieldFormatter.formatContractPeriods(fieldName, periods);
                assertTrue(value.contains(dateFormat[1]), fieldName + ": " + value);
                assertTrue(value.contains(dateFormat[2]), fieldName + ": " + value);
                assertTrue(value.contains("(" + unit[2] + ")"), fieldName + ": " + value);
                assertTrue(value.endsWith("(총 " + unit[3] + ")"), fieldName + ": " + value);
            }
        }
    }
}
