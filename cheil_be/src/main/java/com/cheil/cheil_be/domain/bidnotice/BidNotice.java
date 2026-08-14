package com.cheil.cheil_be.domain.bidnotice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 공고문 관리 메뉴에서 다루는 입찰 공고 도메인 모델이다.
 *
 * <p>화면과 API 사이에서는 Java 표준 명명 규칙인 camelCase를 사용하고,
 * DB에는 기존 엑셀 컬럼 의미를 유지한 snake_case 컬럼으로 저장한다.</p>
 */
public record BidNotice(
        Long bidSeq,
        String departmentCode,
        String projectName,
        String orderClient,
        BigDecimal designAmt,
        String bidType,
        String bidMethod,
        LocalDate announceDate,
        LocalDateTime pqRegistDate,
        LocalDateTime pqSubmitDate,
        String orderMethod,
        LocalDateTime bidDate,
        String bidSuccessYn,
        String pqDecideEmpno,
        LocalDate pqDecideDate,
        String superDecideEmpno,
        String participateYn,
        String businessType,
        LocalDateTime bidSubmissionDate,
        String processTag,
        LocalDateTime bidClosingDate,
        String fieldOfWorkCode,
        String scopeOfWorkCode,
        String reasonOfAbsenceCode,
        LocalDateTime siteBriefingDate,
        LocalDateTime tpSubmitDate,
        String tpPassYn,
        String primeContractor,
        String remark,
        String refmatYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
