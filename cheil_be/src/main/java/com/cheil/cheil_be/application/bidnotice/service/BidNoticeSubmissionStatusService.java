package com.cheil.cheil_be.application.bidnotice.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.integerRange;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetail;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSubmissionStatusUseCase;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BidNoticeSubmissionStatusService implements BidNoticeSubmissionStatusUseCase {
    private static final int COMPARISON_YEARS = 5;
    private static final int MIN_BASE_YEAR = 1900;
    private static final int MAX_YEAR = 9999;

    private final BidNoticeSubmissionRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<BidNoticeSubmissionCount> findByDepartmentAndYear(int year, int throughMonth) {
        integerRange(year, MIN_BASE_YEAR, MAX_YEAR, "year");
        integerRange(throughMonth, 1, 12, "throughMonth");
        return repository.countByDepartmentAndYear(year - COMPARISON_YEARS, year, throughMonth);
    }

    @Override
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Page<BidNoticeSubmissionDetail> findDetails(BidNoticeSubmissionDetailQuery query, Pageable pageable) {
        integerRange(query.lastYear(), MIN_BASE_YEAR - COMPARISON_YEARS, MAX_YEAR, "lastYear");
        integerRange(query.firstYear(), Math.max(MIN_BASE_YEAR - COMPARISON_YEARS, query.lastYear() - COMPARISON_YEARS),
                query.lastYear(), "firstYear");
        integerRange(query.throughMonth(), 1, 12, "throughMonth");
        integerRange(query.fromMonth(), 1, query.throughMonth(), "fromMonth");
        return repository.findDetails(query, pageable);
    }
}
