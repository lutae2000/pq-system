package com.cheil.cheil_be.application.bidnotice.port.out;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDashboardSummary;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDepartmentSummary;
import java.util.List;

public interface BidNoticeDashboardSummaryRepository {
    BidNoticeDashboardSummary findAnnualSummary(int year);

    List<BidNoticeDepartmentSummary> findAnnualDepartmentSummaries(int year);
}
