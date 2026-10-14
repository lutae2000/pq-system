package com.cheil.batch.g2bbidnotice.application.service;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.application.port.in.FetchG2bBidNoticesUseCase;
import com.cheil.batch.g2bbidnotice.application.port.out.LoadG2bBidNoticesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 나라장터 입찰공고 조회 유스케이스를 구현합니다.
 * 외부 API 호출은 LoadG2bBidNoticesPort 구현체에 위임합니다.
 */
@Service
@RequiredArgsConstructor
public class G2bBidNoticeService implements FetchG2bBidNoticesUseCase {

    private final LoadG2bBidNoticesPort loadG2bBidNoticesPort;

    @Override
    public G2bBidNoticePage fetch(G2bBidNoticeQuery query) {
        return loadG2bBidNoticesPort.load(query);
    }
}
