package com.cheil.cheil_be.adapter.out.persistence.file;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeAttachmentRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;

@Repository
@RequiredArgsConstructor
public class BidNoticeAttachmentRepositoryAdapter implements BidNoticeAttachmentRepository {

    private static final String BID_NOTICE_OWNER_TYPE = "BID_NOTICE";

    private final FileAttachmentService fileAttachmentService;

    @Override
    public void deleteAllByBidSeq(Long bidSeq) {
        if (bidSeq == null) {
            return;
        }
        fileAttachmentService.deleteAll(BID_NOTICE_OWNER_TYPE, String.valueOf(bidSeq));
    }
}
