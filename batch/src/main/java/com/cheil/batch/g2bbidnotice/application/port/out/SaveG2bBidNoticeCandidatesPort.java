package com.cheil.batch.g2bbidnotice.application.port.out;

import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;

import java.time.Instant;
import java.util.List;

/** 나라장터 원본 공고를 관리자 검토용 임시 테이블에 저장하는 출력 포트입니다. */
public interface SaveG2bBidNoticeCandidatesPort {

    void upsertAll(List<G2bBidNotice> notices, Instant fetchedAt, String requestFrom, String requestTo);
}
