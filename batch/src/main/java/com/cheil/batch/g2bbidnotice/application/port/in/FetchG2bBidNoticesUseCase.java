package com.cheil.batch.g2bbidnotice.application.port.in;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;

/**
 * 나라장터 입찰공고를 조회하는 인바운드 포트입니다.
 * 배치 Job은 외부 API 구현체 대신 이 인터페이스만 호출합니다.
 */
public interface FetchG2bBidNoticesUseCase {

    G2bBidNoticePage fetch(G2bBidNoticeQuery query);
}
