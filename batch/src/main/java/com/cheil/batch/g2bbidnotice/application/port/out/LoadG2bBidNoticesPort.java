package com.cheil.batch.g2bbidnotice.application.port.out;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;

/**
 * 나라장터와 통신하는 아웃바운드 포트입니다.
 */
public interface LoadG2bBidNoticesPort {

    G2bBidNoticePage load(G2bBidNoticeQuery query);
}
