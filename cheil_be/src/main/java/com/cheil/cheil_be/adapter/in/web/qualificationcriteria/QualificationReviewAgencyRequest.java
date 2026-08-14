package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

public record QualificationReviewAgencyRequest(
        String agencyCode,
        String agencyName,
        String remark,
        Boolean useYn
) {
}
