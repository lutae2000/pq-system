package com.cheil.cheil_be.adapter.in.web.bidnotice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.domain.bidnotice.BidNotice;

class BidNoticeResponseMapperTest {

    private final BidNoticeResponseMapper mapper = new BidNoticeResponseMapper(null, null, null, null);
    private final BidNoticeResponseMapper.BidNoticeResponseLookup lookup =
            new BidNoticeResponseMapper.BidNoticeResponseLookup(
                    Map.of(), Map.of("C001", "서울시"), Map.of());

    @Test
    void resolvesLegacyOrderClientCodeWhenClientCodeIsMissing() {
        BidNotice notice = mock(BidNotice.class);
        when(notice.orderClient()).thenReturn("C001");

        assertThat(mapper.toResponse(notice, lookup).orderClientName()).isEqualTo("서울시");
    }

    @Test
    void keepsUnmatchedOrderClientText() {
        BidNotice notice = mock(BidNotice.class);
        when(notice.orderClient()).thenReturn("기타 발주처");

        assertThat(mapper.toResponse(notice, lookup).orderClientName()).isEqualTo("기타 발주처");
    }
}
