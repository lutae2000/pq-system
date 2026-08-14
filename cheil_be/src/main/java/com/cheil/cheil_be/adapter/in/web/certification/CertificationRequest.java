package com.cheil.cheil_be.adapter.in.web.certification;

import com.cheil.cheil_be.application.certification.port.in.CertificationUpsertCommand;

public record CertificationRequest(
        String certCode,
        String certName,
        Integer certKind,
        String satisCode,
        String satisName,
        Boolean useYn
) {

    public CertificationUpsertCommand toCommand() {
        return new CertificationUpsertCommand(
                certCode,
                certName,
                certKind,
                satisCode,
                satisName,
                useYn
        );
    }
}
