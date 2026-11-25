package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;
import lombok.With;

import java.time.Instant;
import java.math.BigDecimal;

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
        @With ParticipationContractPeriod participationContractPeriod
) {
}
