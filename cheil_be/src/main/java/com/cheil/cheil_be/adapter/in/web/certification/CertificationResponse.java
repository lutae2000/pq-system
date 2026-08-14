package com.cheil.cheil_be.adapter.in.web.certification;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.certification.Certification;

public record CertificationResponse(
        String certCode,
        String certName,
        int certKind,
        String satisCode,
        String satisName,
        boolean useYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static CertificationResponse from(Certification certification) {
        return new CertificationResponse(
                certification.certCode(),
                certification.certName(),
                certification.certKind(),
                certification.satisCode(),
                certification.satisName(),
                certification.useYn(),
                certification.createdAt() == null ? null : certification.createdAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                certification.createdId(),
                certification.lastChangedAt() == null ? null : certification.lastChangedAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                certification.lastChangedId()
        );
    }
}
