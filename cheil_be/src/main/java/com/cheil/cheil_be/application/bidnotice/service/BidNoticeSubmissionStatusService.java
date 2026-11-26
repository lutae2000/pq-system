package com.cheil.cheil_be.application.bidnotice.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.integerRange;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSubmissionStatusUseCase;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BidNoticeSubmissionStatusService implements BidNoticeSubmissionStatusUseCase {
    private static final int COMPARISON_YEARS = 5;

    private final BidNoticeSubmissionRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<BidNoticeSubmissionCount> findByDepartmentAndYear(int year, int throughMonth) {
        integerRange(year, 1900, 9999, "year");
        integerRange(throughMonth, 1, 12, "throughMonth");
        return repository.countByDepartmentAndYear(year - COMPARISON_YEARS, year, throughMonth);
    }
}
