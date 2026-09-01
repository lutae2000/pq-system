package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

class HwpxFieldFormatterTest {

    private final EngineerProjectHistoryReviewResponse review = review();

    @Test
    void formatsDatesUsingTheTemplateFieldName() {
        assertEquals("2026-01-01", HwpxFieldFormatter.format("용역시작일(yyyy-mm-dd)", review));
        assertEquals("26.03.02", HwpxFieldFormatter.format("용역종료일(yy.mm.dd)", review));
        assertEquals("2026.04.01", HwpxFieldFormatter.format("참여시작일(yyyy.mm.dd)", review));
        assertEquals("2026-05", HwpxFieldFormatter.format("참여종료일(yyyy-mm)", review));
        assertEquals("2026년04월", HwpxFieldFormatter.format("참여시작일(yyyy년mm월)", review));
        assertEquals("1980.01.01", HwpxFieldFormatter.formatBirthDate("기본_생년월일(yyyy.mm.dd)", "19800101"));
    }

    @Test
    void formatsDateRangesAndCalculatedDurations() {
        assertEquals(
                "2026-01-01 ~ 2026-03-02",
                HwpxFieldFormatter.format("용역기간(yyyy-mm-dd)", review)
        );
        assertEquals(
                "2026-01-01 ~ 2026-03-02 (61일)",
                HwpxFieldFormatter.format("용역기간(yyyy-mm-dd)(일)", review)
        );
        assertEquals(
                "2026.04.01 ~ 2026.05.31 (2개월)",
                HwpxFieldFormatter.format("경력_참여기간(yyyy.mm.dd)(월)", review)
        );
        assertEquals(
                "26.04.01 ~ 26.05.31 (0.17년)",
                HwpxFieldFormatter.format("경력_참여기간(yy.mm.dd)(년)", review)
        );
    }

    @Test
    void formatsAmountsUsingTheUnitInTheTemplateFieldName() {
        assertEquals("123,456,789", HwpxFieldFormatter.format("총계약금액(원)", review));
        assertEquals("123,456", HwpxFieldFormatter.format("총계약금액(천)", review));
        assertEquals("12,345", HwpxFieldFormatter.format("총계약금액(만)", review));
        assertEquals("123", HwpxFieldFormatter.format("경력_총계약금액(백만)", review));
        assertEquals("1", HwpxFieldFormatter.format("경력_총계약금액(억)", review));
        assertEquals("98,765,432", HwpxFieldFormatter.format("경력_당사금액(원)", review));
        assertEquals("98,765", HwpxFieldFormatter.format("경력_당사금액(천)", review));
        assertEquals("9,876", HwpxFieldFormatter.format("경력_당사금액(만)", review));
        assertEquals("98", HwpxFieldFormatter.format("경력_당사금액(백만)", review));
        assertEquals("0", HwpxFieldFormatter.format("경력_당사금액(억)", review));
        assertEquals("123\n(98)", HwpxFieldFormatter.format("경력_총계약금액(백만)(당사금액)", review));
        assertEquals("123,456,789\n(98,765,432)", HwpxFieldFormatter.format("경력_총계약금액(원)(당사금액)", review));
        assertEquals("98\n(123)", HwpxFieldFormatter.format("경력_당사금액(백만)(총계약금액)", review));
        assertEquals("98,765", HwpxFieldFormatter.format("당사금액(천)", review));
    }

    @Test
    void formatsEngineerEmploymentHistoryFields() {
        EngineerDtos.Career history = new EngineerDtos.Career(
                1L,
                "E001",
                "20260101",
                "20260302",
                "제일엔지니어링",
                "사업관리부",
                "부장",
                "설계"
        );

        assertEquals("2026.01.01", HwpxFieldFormatter.format("이력_입사일(yyyy.mm.dd)", history));
        assertEquals("2026-03", HwpxFieldFormatter.format("이력_퇴사일(yyyy-mm)", history));
        assertEquals("60", HwpxFieldFormatter.format("이력_근무기간(일)", history));
        assertEquals("2", HwpxFieldFormatter.format("이력_근무기간(월)", history));
    }

    private EngineerProjectHistoryReviewResponse review() {
        return new EngineerProjectHistoryReviewResponse(
                1L,
                1L,
                "E001",
                1,
                1,
                "1",
                "용역명",
                "용역개요",
                "",
                "",
                "",
                1,
                "발주처",
                new BigDecimal("123456789"),
                new BigDecimal("98765432"),
                BigDecimal.ZERO,
                "20260101",
                "20260302",
                "20260401",
                "20260531",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                60,
                60,
                60,
                "",
                null,
                null,
                null,
                null
        );
    }
}
