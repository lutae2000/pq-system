package com.cheil.batch.g2bbidnotice.application.service;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeQuery;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncCommand;
import com.cheil.batch.g2bbidnotice.application.port.in.FetchG2bBidNoticesUseCase;
import com.cheil.batch.g2bbidnotice.application.port.out.SaveG2bBidNoticeCandidatesPort;
import com.cheil.batch.g2bbidnotice.domain.G2bBidNoticePage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class G2bBidNoticeCandidateSyncServiceTest {

    @Mock
    private FetchG2bBidNoticesUseCase fetchUseCase;

    @Mock
    private SaveG2bBidNoticeCandidatesPort savePort;

    @InjectMocks
    private G2bBidNoticeCandidateSyncService service;

    @Test
    void mergesUnrestrictedAndRegionResultsByNoticeNumberAndOrder() {
        var from = ZonedDateTime.of(2026, 10, 14, 9, 0, 0, 0, ZoneId.of("Asia/Seoul"));
        var to = from.plusHours(1);
        var unrestrictedNotice = new com.cheil.batch.g2bbidnotice.domain.G2bBidNotice(
                "R26TEST", "001", null, "등록공고", "공고명", "기관", "수요기관", "D1",
                "계약", "용역", null, null, null, null, null, null, null,
                null, "202610140900", null, null, "202610140900", null, null, null, List.of(), "{}"
        );
        var regionNotice = new com.cheil.batch.g2bbidnotice.domain.G2bBidNotice(
                "R26TEST", "001", null, "등록공고", "공고명", "기관", "수요기관", "D1",
                "계약", "용역", null, null, null, null, null, null, null,
                null, "202610140900", null, null, "202610140900", null, null, null, List.of(), "{}"
        );
        when(fetchUseCase.fetch(any(G2bBidNoticeQuery.class)))
                .thenReturn(new G2bBidNoticePage(1, 100, 1, List.of(unrestrictedNotice)))
                .thenReturn(new G2bBidNoticePage(1, 100, 1, List.of(regionNotice)));

        var result = service.sync(new G2bBidNoticeSyncCommand(from, to, List.of("11"), 100, true));

        assertThat(result.fetchedCount()).isEqualTo(1);
        ArgumentCaptor<List<com.cheil.batch.g2bbidnotice.domain.G2bBidNotice>> captor = ArgumentCaptor.forClass(List.class);
        verify(savePort).upsertAll(captor.capture(), any(), any(), any());
        assertThat(captor.getValue()).singleElement().satisfies(notice ->
                assertThat(notice.participationLimitRegionCode()).isEqualTo("11"));
    }
}
