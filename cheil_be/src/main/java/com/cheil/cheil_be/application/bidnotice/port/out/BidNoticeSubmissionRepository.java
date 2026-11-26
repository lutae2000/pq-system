package com.cheil.cheil_be.application.bidnotice.port.out;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import java.util.List;

public interface BidNoticeSubmissionRepository {
    List<BidNoticeSubmissionCount> countByDepartmentAndYear(int firstYear, int lastYear, int throughMonth);
}
