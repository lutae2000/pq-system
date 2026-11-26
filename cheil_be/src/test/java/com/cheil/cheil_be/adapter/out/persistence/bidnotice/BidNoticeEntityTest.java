package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BidNoticeEntityTest {

    @Test
    void preservesSelectedCodesAndScheduleWhenCreatingAndUpdating() {
        var initial = BidNoticeEntity.builder()
                .projectName("공고")
                .bidType("11")
                .bidMethod("ZA1")
                .orderMethod("FAA")
                .bidSuccessYn("N")
                .scopeOfWorkCode("T2A")
                .bidDate("202611251430")
                .build().toDomain();
        var entity = BidNoticeEntity.from(initial);
        assertThat(entity.toDomain()).isEqualTo(initial);

        var amended = BidNoticeEntity.builder()
                .projectName("공고")
                .bidType("22")
                .bidMethod("ZA2")
                .orderMethod("FAJ")
                .bidSuccessYn("Y")
                .scopeOfWorkCode("T2B")
                .bidDate("202611271530")
                .build().toDomain();
        entity.updateFrom(amended);
        assertThat(entity.toDomain()).isEqualTo(amended);
    }

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
