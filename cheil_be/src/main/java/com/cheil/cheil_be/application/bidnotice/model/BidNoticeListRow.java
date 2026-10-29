package com.cheil.cheil_be.application.bidnotice.model;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

public record BidNoticeListRow(BidNotice bidNotice, String orderClientName, String departmentName) {
}
