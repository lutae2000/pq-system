package com.cheil.cheil_be.application.bidnotice.port.in;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 공고문 생성/수정 요청을 서비스 계층으로 전달하기 위한 명령 객체이다.
 */
public record BidNoticeUpsertCommand(
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
        LocalDate interviewDate,
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
        String createdId,
        String lastChangedId
) {
}
