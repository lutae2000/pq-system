package com.cheil.cheil_be.application.certification.port.in;

public record CertificationUpsertCommand(
        String certCode,
        String certName,
        Integer certKind,
        String satisCode,
        String satisName,
        Boolean useYn
) {
}
