package com.cheil.cheil_be.application.bidnotice.model;

public record BidNoticeSubmissionCount(String departmentCode, int year, long count, long monthlyCount, boolean total) {}
