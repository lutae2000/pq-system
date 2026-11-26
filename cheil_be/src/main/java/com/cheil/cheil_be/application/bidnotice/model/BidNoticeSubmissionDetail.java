package com.cheil.cheil_be.application.bidnotice.model;

import java.math.BigDecimal;

public record BidNoticeSubmissionDetail(
        long bidSeq, String projectName, String departmentCode, String pqSubmitDate, String g2bBidNtceNo,
        String participateYn, String bidSuccessYn, String businessType, String orderClient, String orderClientName,
        String announceDate, String bidClosingDate, String bidSubmissionDate, String bidDate, BigDecimal designAmt,
        String superDecideEmpno
) {}
