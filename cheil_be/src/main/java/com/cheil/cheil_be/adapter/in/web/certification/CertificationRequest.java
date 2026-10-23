package com.cheil.cheil_be.adapter.in.web.certification;

import com.cheil.cheil_be.application.certification.port.in.CertificationUpsertCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CertificationRequest(
        @Size(max = 20, message = "certCode는 20자 이하로 입력해야 합니다.")
        String certCode,
        @NotBlank(message = "certName은 필수입니다.")
        @Size(max = 200, message = "certName은 200자 이하로 입력해야 합니다.")
        String certName,
        @Min(value = 0, message = "certKind는 0 이상이어야 합니다.")
        @Max(value = 4, message = "certKind는 4 이하여야 합니다.")
        Integer certKind,
        @Size(max = 20, message = "satisCode는 20자 이하로 입력해야 합니다.")
        String satisCode,
        @Size(max = 200, message = "satisName은 200자 이하로 입력해야 합니다.")
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
