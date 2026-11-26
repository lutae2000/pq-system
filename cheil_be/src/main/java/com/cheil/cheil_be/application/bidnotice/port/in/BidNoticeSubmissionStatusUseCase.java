package com.cheil.cheil_be.application.bidnotice.port.in;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import java.util.List;

public interface BidNoticeSubmissionStatusUseCase {
    List<BidNoticeSubmissionCount> findByDepartmentAndYear(int year, int throughMonth);
}
