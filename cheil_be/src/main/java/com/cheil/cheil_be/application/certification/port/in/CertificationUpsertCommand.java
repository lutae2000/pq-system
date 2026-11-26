package com.cheil.cheil_be.application.certification.port.in;

import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.certification.Certification;

public record CertificationUpsertCommand(
        String certCode,
        String certName,
        Integer certKind,
        Boolean useYn
) {

    public CertificationUpsertCommand {
        certCode = StringValues.trimToNull(certCode);
        InputValues.validateMaxLength(certCode, 20, "certCode");
        certName = InputValues.requiredText(certName, 200, "certName");
        certKind = certKind == null ? Certification.UNCLASSIFIED_KIND : InputValues.integerRange(certKind, 0, 4, "certKind");
    }

    public Certification toDomain(String code) {
        return new Certification(code, certName, certKind,
                useYn == null || useYn, null, null, null, null);
    }
}
