package com.cheil.cheil_be.adapter.in.web.bidnotice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

/**
 * 공고문 응답 DTO이다.
 *
 * <p>목록, 상세, 캘린더 월별 조회에서 같은 응답 구조를 사용해
 * 화면이 별도 변환 없이 동일한 필드를 재사용할 수 있도록 한다.</p>
 */
public record BidNoticeResponse(
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
        String orderMethodLabel,
        LocalDateTime bidDate,
        String bidSuccessYn,
        String bidSuccessYnLabel,
        String pqDecideEmpno,
        LocalDate pqDecideDate,
        String superDecideEmpno,
        String participateYn,
        String participateYnLabel,
        String businessType,
        String businessTypeLabel,
        LocalDateTime bidSubmissionDate,
        String processTag,
        LocalDateTime bidClosingDate,
        String fieldOfWorkCode,
        String fieldOfWorkLabel,
        String scopeOfWorkCode,
        String scopeOfWorkLabel,
        String reasonOfAbsenceCode,
        LocalDateTime siteBriefingDate,
        LocalDateTime tpSubmitDate,
        String tpPassYn,
        String primeContractor,
        String remark,
        String refmatYn,
        String departmentName,
        String orderClientName,
        String bidTypeLabel,
        String bidMethodLabel,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {

    static BidNoticeResponse from(BidNotice bidNotice) {
        return from(bidNotice, new BidNoticeLabels(null, null, null, null, null, null, null, null, null, null));
    }

    static BidNoticeResponse from(BidNotice bidNotice, BidNoticeLabels labels) {
        return new BidNoticeResponse(
                bidNotice.bidSeq(),
                bidNotice.departmentCode(),
                bidNotice.projectName(),
                bidNotice.orderClient(),
                bidNotice.designAmt(),
                bidNotice.bidType(),
                bidNotice.bidMethod(),
                bidNotice.announceDate(),
                bidNotice.pqRegistDate(),
                bidNotice.pqSubmitDate(),
                bidNotice.orderMethod(),
                labels.orderMethodLabel(),
                bidNotice.bidDate(),
                bidNotice.bidSuccessYn(),
                labels.bidSuccessYnLabel(),
                bidNotice.pqDecideEmpno(),
                bidNotice.pqDecideDate(),
                bidNotice.superDecideEmpno(),
                bidNotice.participateYn(),
                labels.participateYnLabel(),
                bidNotice.businessType(),
                labels.businessTypeLabel(),
                bidNotice.bidSubmissionDate(),
                bidNotice.processTag(),
                bidNotice.bidClosingDate(),
                bidNotice.fieldOfWorkCode(),
                labels.fieldOfWorkLabel(),
                bidNotice.scopeOfWorkCode(),
                labels.scopeOfWorkLabel(),
                bidNotice.reasonOfAbsenceCode(),
                bidNotice.siteBriefingDate(),
                bidNotice.tpSubmitDate(),
                bidNotice.tpPassYn(),
                bidNotice.primeContractor(),
                bidNotice.remark(),
                bidNotice.refmatYn(),
                labels.departmentName(),
                labels.orderClientName(),
                labels.bidTypeLabel(),
                labels.bidMethodLabel(),
                bidNotice.createdAt(),
                bidNotice.createdId(),
                bidNotice.lastChangedAt(),
                bidNotice.lastChangedId()
        );
    }
}
