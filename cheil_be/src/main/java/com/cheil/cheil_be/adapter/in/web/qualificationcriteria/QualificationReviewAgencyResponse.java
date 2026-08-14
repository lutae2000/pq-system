package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewAgencyEntity;

public record QualificationReviewAgencyResponse(
        Long id,
        String agencyCode,
        String agencyName,
        String remark,
        boolean useYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {

    public static QualificationReviewAgencyResponse from(QualificationReviewAgencyEntity entity) {
        return new QualificationReviewAgencyResponse(
                entity.getId(),
                entity.getAgencyCode(),
                entity.getAgencyName(),
                entity.getRemark(),
                entity.isUseYn(),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString(),
                entity.getCreatedId(),
                entity.getLastChangedAt() == null ? null : entity.getLastChangedAt().toString(),
                entity.getLastChangedId()
        );
    }
}
