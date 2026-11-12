package com.cheil.batch.g2bbidnotice.application.service;

import com.cheil.batch.g2bbidnotice.application.port.in.CleanupG2bBidNoticesUseCase;
import com.cheil.batch.g2bbidnotice.application.port.out.G2bBidNoticeCleanupPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class G2bBidNoticeCleanupService implements CleanupG2bBidNoticesUseCase {
    private final G2bBidNoticeCleanupPort cleanupPort;

    @Override
    public CleanupResult cleanup() {
        String value = cleanupPort.findRetentionMonths();
        if (value == null) {
            log.info("G2B 공고 정리 건너뜀: 보관 개월수 정책이 없거나 비활성화되어 있습니다.");
            return new CleanupResult(0, 0);
        }
        int months;
        try {
            months = Integer.parseInt(value.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalStateException("G2B 공고 보관 개월수는 양의 정수여야 합니다.", exception);
        }
        if (months < 1) {
            throw new IllegalStateException("G2B 공고 보관 개월수는 1개월 이상이어야 합니다.");
        }
        int candidates = cleanupPort.deleteExpiredCandidates(months);
        int syncItems = cleanupPort.deleteExpiredSyncItems(months);
        log.info("G2B 공고 정리 완료: 보관 개월수={}개월, 후보 삭제={}건, 동기화 이력 삭제={}건", months, candidates, syncItems);
        return new CleanupResult(candidates, syncItems);
    }
}
