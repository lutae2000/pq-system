package com.cheil.cheil_be.application.bidnotice.port.in;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetail;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BidNoticeSubmissionStatusUseCase {
    List<BidNoticeSubmissionCount> findByDepartmentAndYear(int year, int throughMonth);

    Page<BidNoticeSubmissionDetail> findDetails(BidNoticeSubmissionDetailQuery query, Pageable pageable);
}
