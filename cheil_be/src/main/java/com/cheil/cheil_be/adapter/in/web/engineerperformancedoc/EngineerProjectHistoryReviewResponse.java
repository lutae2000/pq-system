package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

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
        String method,
        String jobTag,
        String jobPart,
        String proPart,
        String engLevel,
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
        String lastChangedId
) {
}
