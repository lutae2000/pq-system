package com.cheil.cheil_be.adapter.in.web.bidnotice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeUpsertCommand;

/**
 * 공고문 생성/수정 요청 DTO이다.
 *
 * <p>날짜는 JSON에서 yyyy-MM-dd 형식으로 전달받는다.
 * bidSeq는 신규 등록 시 생략하면 DB에서 자동 채번되고, 기존 데이터 이관처럼
 * 순번을 보존해야 하는 경우에는 값 전달을 허용한다.</p>
 */
public record BidNoticeRequest(
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
        String createdId,
        String lastChangedId
) {

    BidNoticeUpsertCommand toCommand() {
        return new BidNoticeUpsertCommand(
                bidSeq,
                departmentCode,
                projectName,
                orderClient,
                designAmt,
                bidType,
                bidMethod,
                announceDate,
                pqRegistDate,
                pqSubmitDate,
                orderMethod,
                bidDate,
                bidSuccessYn,
                pqDecideEmpno,
                pqDecideDate,
                superDecideEmpno,
                participateYn,
                businessType,
                bidSubmissionDate,
                processTag,
                bidClosingDate,
                fieldOfWorkCode,
                scopeOfWorkCode,
                reasonOfAbsenceCode,
                siteBriefingDate,
                tpSubmitDate,
                tpPassYn,
                primeContractor,
                remark,
                refmatYn,
                createdId,
                lastChangedId
        );
    }
}
