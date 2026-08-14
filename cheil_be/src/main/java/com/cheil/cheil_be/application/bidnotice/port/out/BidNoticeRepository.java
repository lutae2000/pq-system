package com.cheil.cheil_be.application.bidnotice.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

public interface BidNoticeRepository {

    Page<BidNotice> findAll(BidNoticeSearchCondition condition, Pageable pageable);

    List<BidNotice> findAllByCalendarDateBetween(LocalDate startDate, LocalDate endDate, String departmentCode);

    Optional<BidNotice> findByBidSeq(Long bidSeq);

    boolean existsByBidSeq(Long bidSeq);

    BidNotice save(BidNotice bidNotice);

    void deleteByBidSeq(Long bidSeq);
}
