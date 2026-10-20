package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BidNoticeEntityTest {

    @Test
    void ignoresMalformedOptionalDateValuesWhenConvertingToDomain() {
        var entity = BidNoticeEntity.builder()
                .projectName("공고")
                .announceDate("20261340")
                .pqSubmitDate("not-a-date")
                .build();

        var bidNotice = entity.toDomain();

        assertThat(bidNotice.announceDate()).isNull();
        assertThat(bidNotice.pqSubmitDate()).isNull();
    }
}
