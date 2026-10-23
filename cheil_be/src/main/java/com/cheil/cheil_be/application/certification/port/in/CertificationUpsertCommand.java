package com.cheil.cheil_be.application.certification.port.in;

import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.certification.Certification;

public record CertificationUpsertCommand(
        String certCode,
        String certName,
        Integer certKind,
        String satisCode,
        String satisName,
        Boolean useYn
) {

    public CertificationUpsertCommand {
        certCode = StringValues.trimToNull(certCode);
        InputValues.validateMaxLength(certCode, 20, "certCode");
        certName = InputValues.requiredText(certName, 200, "certName");
        certKind = certKind == null ? 0 : InputValues.integerRange(certKind, 0, 4, "certKind");
        satisCode = optional(satisCode, 20, "satisCode");
        satisName = optional(satisName, 200, "satisName");
    }

    public Certification toDomain(String code) {
        return new Certification(code, certName, certKind, satisCode, satisName,
                useYn == null || useYn, null, null, null, null);
    }

    private static String optional(String value, int maxLength, String fieldName) {
        String normalized = StringValues.trimToNull(value);
        InputValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }
}
