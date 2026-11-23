package com.cheil.cheil_be.application.bidnotice.model;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

public record BidNoticeCalendarRow(BidNotice bidNotice, String orderClientName) {
}
