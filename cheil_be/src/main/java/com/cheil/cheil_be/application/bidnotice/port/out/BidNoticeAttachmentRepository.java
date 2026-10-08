package com.cheil.cheil_be.application.bidnotice.port.out;

public interface BidNoticeAttachmentRepository {

    void deleteAllByBidSeq(Long bidSeq);
}
