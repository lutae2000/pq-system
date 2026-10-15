package com.cheil.batch.g2bbidnotice.application.service;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncCommand;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncResult;
import com.cheil.batch.g2bbidnotice.application.port.in.FetchG2bBidNoticesUseCase;
import com.cheil.batch.g2bbidnotice.application.port.in.SyncG2bBidNoticeCandidatesUseCase;
import com.cheil.batch.g2bbidnotice.application.port.out.SaveG2bBidNoticeCandidatesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class G2bBidNoticeCandidateSyncService implements SyncG2bBidNoticeCandidatesUseCase {

    private static final DateTimeFormatter API_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final FetchG2bBidNoticesUseCase fetchG2bBidNoticesUseCase;
    private final SaveG2bBidNoticeCandidatesPort saveG2bBidNoticeCandidatesPort;

    @Override
    public G2bBidNoticeSyncResult sync(G2bBidNoticeSyncCommand command) {
        Map<String, G2bBidNotice> noticeByKey = new LinkedHashMap<>();
        int baseTotalCount = 0;

        List<String> regionCodes = command.regionCodes().stream()
                .filter(regionCode -> !regionCode.isBlank())
                .toList();
        if (command.includeUnrestricted() && regionCodes.isEmpty()) {
            Map<String, G2bBidNotice> unrestrictedNotices = new LinkedHashMap<>();
            baseTotalCount = fetchPages(command, unrestrictedNotices, List.of());
            save(unrestrictedNotices, command);
            mergeNotices(noticeByKey, unrestrictedNotices);
        }
        for (String regionCode : regionCodes) {
            Map<String, G2bBidNotice> regionNotices = new LinkedHashMap<>();
            fetchPages(command, regionNotices, List.of(regionCode));
            save(regionNotices, command);
            mergeNotices(noticeByKey, regionNotices);
        }

        List<G2bBidNotice> notices = new ArrayList<>(noticeByKey.values());
        log.info("나라장터 동기화 유스케이스 완료: 조회={}, 저장={}", baseTotalCount, notices.size());
        return new G2bBidNoticeSyncResult(baseTotalCount, notices.size());
    }

    private void save(Map<String, G2bBidNotice> noticesByKey, G2bBidNoticeSyncCommand command) {
        if (noticesByKey.isEmpty()) {
            return;
        }
        saveG2bBidNoticeCandidatesPort.upsertAll(
                new ArrayList<>(noticesByKey.values()),
                Instant.now(),
                command.from().format(API_DATE_TIME_FORMATTER),
                command.to().format(API_DATE_TIME_FORMATTER)
        );
    }

    private void mergeNotices(Map<String, G2bBidNotice> target, Map<String, G2bBidNotice> source) {
        source.values().forEach(notice -> target.merge(
                noticeKey(notice),
                notice,
                G2bBidNotice::merge
        ));
    }

    private int fetchPages(
            G2bBidNoticeSyncCommand command,
            Map<String, G2bBidNotice> noticeByKey,
            List<String> regionCodes
    ) {
        int pageNumber = 1;
        int totalCount = 0;
        do {
            G2bBidNoticePage result = fetchG2bBidNoticesUseCase.fetch(new G2bBidNoticeQuery(
                    command.from(), command.to(), regionCodes, pageNumber, command.pageSize()
            ));
            if (pageNumber == 1) {
                totalCount = result.totalCount();
            }
            result.notices().stream()
                    .map(notice -> regionCodes.size() == 1
                            ? notice.withParticipationLimitRegionCode(regionCodes.getFirst())
                            : notice)
                    .forEach(notice -> noticeByKey.merge(
                            noticeKey(notice),
                            notice,
                            G2bBidNotice::merge
                    ));
            pageNumber++;
            if (result.notices().isEmpty() || (long) (pageNumber - 1) * command.pageSize() >= result.totalCount()) {
                break;
            }
        } while (true);
        return totalCount;
    }

    private String noticeKey(G2bBidNotice notice) {
        return notice.bidNoticeNumber() + "|" + notice.bidNoticeOrder();
    }
}
