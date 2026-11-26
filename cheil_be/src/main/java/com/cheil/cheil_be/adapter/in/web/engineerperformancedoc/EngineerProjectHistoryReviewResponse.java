package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import com.cheil.cheil_be.application.engineerperformancedoc.model.EngineerProjectHistoryReview;
import com.cheil.cheil_be.domain.companyperformance.ContractPeriodDates;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import lombok.With;

public record EngineerProjectHistoryReviewResponse(
        Long reviewId,
        Long bidSeq,
        String engineerId,
        Integer sourceSeq,
        Integer displayOrder,
        String id,
        String jobName,
        String summary,
        String contractTerm,
        String workTerm,
        String workDays,
        Integer seq,
        String orderClient,
        BigDecimal contractAmt,
        BigDecimal ownAmt,
        BigDecimal divisionRate,
        String contractFromDate,
        String contractToDate,
        String startDate,
        String endDate,
        String jobClass,
        String jobTag,
        String jobPart,
        String proPart,
        String compName,
        String deptName,
        String grade,
        String duty,
        String returnYn,
        String joinYn,
        Integer joinDay,
        Integer partDay,
        Integer selectDay,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId,
        @With List<ContractPeriodDates> contractPeriods
) {
    public static EngineerProjectHistoryReviewResponse from(EngineerProjectHistoryReview row) {
        return new EngineerProjectHistoryReviewResponse(
                row.reviewId(), row.bidSeq(), row.engineerId(), row.sourceSeq(),
                row.displayOrder(), row.id(), row.jobName(), row.summary(),
                row.contractTerm(), row.workTerm(), row.workDays(), row.seq(),
                row.orderClient(), row.contractAmt(), row.ownAmt(), row.divisionRate(),
                row.contractFromDate(), row.contractToDate(), row.startDate(), row.endDate(),
                row.jobClass(), row.jobTag(), row.jobPart(), row.proPart(),
                row.compName(), row.deptName(), row.grade(), row.duty(),
                row.returnYn(), row.joinYn(), row.joinDay(), row.partDay(),
                row.selectDay(), row.remark(), row.createdAt(), row.createdId(),
                row.lastChangedAt(), row.lastChangedId(), row.contractPeriods()
        );
    }
}
