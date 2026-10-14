package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import com.cheil.batch.g2bbidnotice.application.port.out.SaveG2bBidNoticeCandidatesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNotice;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticeSpecFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 나라장터 API 응답을 데이터베이스에 저장하는 영속성 어댑터입니다.
 *
 * <p>동기화 테이블에는 API에서 확인한 모든 공고를 기록하고, 후보 테이블에는
 * 동기화 테이블에 아직 존재하지 않는 신규 공고만 저장합니다. 공고번호와 차수는
 * 나라장터 공고를 식별하는 복합 키로 사용합니다.</p>
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class G2bBidNoticeCandidatePersistenceAdapter implements SaveG2bBidNoticeCandidatesPort {

    private final G2bBidNoticeCandidateMapper mapper;

    /**
     * API 응답을 동기화 테이블과 후보 테이블에 반영합니다.
     *
     * <p>현재 Step의 트랜잭션 안에서 동기화 이력과 후보 데이터가 함께 저장됩니다.
     * 후보 저장에 실패하면 동기화 이력도 함께 롤백되어 다음 실행에서 재처리할 수 있습니다.</p>
     *
     * @param notices API에서 조회한 공고 목록
     * @param fetchedAt API 응답을 받은 시각
     * @param requestFrom API 조회 시작 시각
     * @param requestTo API 조회 종료 시각
     */
    @Override
    public void upsertAll(List<G2bBidNotice> notices, Instant fetchedAt, String requestFrom, String requestTo) {
        List<G2bBidNotice> fetchedNotices = notices == null ? List.of() : notices;
        Set<String> existingSyncKeys = fetchedNotices.isEmpty()
                ? Set.of()
                : new HashSet<>(mapper.findSyncKeys(fetchedNotices));

        // 같은 공고가 다시 조회되어도 마지막 확인 시각과 API 원본은 갱신합니다.
        if (!fetchedNotices.isEmpty()) {
            mapper.upsertSyncItems(fetchedNotices.stream()
                    .map(notice -> new G2bBidNoticeSyncPersistenceRow(notice, fetchedAt, requestFrom, requestTo))
                    .toList());
        }

        // 변경·취소 공고는 차수가 증가하고 재공고는 새로운 공고번호가 생성되므로,
        // 복합 키가 동기화 테이블에 없는 공고만 후보 테이블에 신규 등록합니다.
        List<G2bBidNotice> newNotices = fetchedNotices.stream()
                .filter(notice -> !existingSyncKeys.contains(syncKey(notice)))
                .toList();

        int upsertedCount = 0;
        if (!newNotices.isEmpty()) {
            upsertedCount = mapper.upsertAll(newNotices.stream()
                    .map(notice -> toPersistenceRow(notice, fetchedAt, requestFrom, requestTo))
                    .toList());
        }

        int linkedCount = mapper.linkImportedNotices();
        int changeNoticeCount = mapper.createChangeNotices();
        log.info(
                "나라장터 후보 반영 완료: API 조회={}, 신규 후보={}, 기존 동기화={}, 업무공고 연계={}, 변경 알림={}",
                fetchedNotices.size(),
                upsertedCount,
                existingSyncKeys.size(),
                linkedCount,
                changeNoticeCount
        );
    }

    private String syncKey(G2bBidNotice notice) {
        return notice.bidNoticeNumber() + "|" + notice.bidNoticeOrder();
    }

    /**
     * 후보 테이블의 첨부파일 컬럼 구조에 맞게 API 첨부파일 목록을 변환합니다.
     * 첨부파일은 1번부터 10번까지의 파일명과 다운로드 URL로 분리해 저장합니다.
     */
    private G2bBidNoticeCandidatePersistenceRow toPersistenceRow(
            G2bBidNotice notice,
            Instant fetchedAt,
            String requestFrom,
            String requestTo
    ) {
        Map<Integer, G2bBidNoticeSpecFile> files = (notice.specificationFiles() == null
                ? Collections.<G2bBidNoticeSpecFile>emptyList()
                : notice.specificationFiles()).stream()
                .collect(Collectors.toMap(
                        G2bBidNoticeSpecFile::sequence,
                        Function.identity(),
                        (first, ignored) -> first
                ));

        Map<Integer, String> fileNames = new LinkedHashMap<>();
        Map<Integer, String> fileUrls = new LinkedHashMap<>();
        IntStream.rangeClosed(1, 10).forEach(sequence -> {
            G2bBidNoticeSpecFile file = files.get(sequence);
            fileNames.put(sequence, file == null ? null : file.fileName());
            fileUrls.put(sequence, file == null ? null : file.documentUrl());
        });

        return new G2bBidNoticeCandidatePersistenceRow(
                notice,
                fetchedAt,
                requestFrom,
                requestTo,
                fileNames,
                fileUrls
        );
    }
}
