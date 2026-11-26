package com.cheil.cheil_be.application.bidnotice.model;

public record BidNoticeSubmissionDetailQuery(
        int firstYear, int lastYear, int fromMonth, int throughMonth, String departmentCode, boolean allDepartments
) {}
