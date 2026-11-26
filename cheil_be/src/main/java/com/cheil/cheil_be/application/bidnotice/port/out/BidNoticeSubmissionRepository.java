package com.cheil.cheil_be.application.bidnotice.port.out;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetail;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BidNoticeSubmissionRepository {
    List<BidNoticeSubmissionCount> countByDepartmentAndYear(int firstYear, int lastYear, int throughMonth);

    Page<BidNoticeSubmissionDetail> findDetails(BidNoticeSubmissionDetailQuery query, Pageable pageable);
}
