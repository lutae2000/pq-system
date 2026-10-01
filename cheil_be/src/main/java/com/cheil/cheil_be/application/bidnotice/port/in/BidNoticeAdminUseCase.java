package com.cheil.cheil_be.application.bidnotice.port.in;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

/**
 * 입찰 공고 관리 use case의 inbound port입니다.
 * 웹 어댑터는 구현 서비스가 아니라 이 포트에 의존합니다.
 */
public interface BidNoticeAdminUseCase {

    Page<BidNotice> findAll(BidNoticeSearchCondition condition, Pageable pageable);

    BidNotice findByBidSeq(Long bidSeq);

    BidNotice create(BidNoticeUpsertCommand command);

    BidNotice update(Long bidSeq, BidNoticeUpsertCommand command);

    void delete(Long bidSeq);
}
