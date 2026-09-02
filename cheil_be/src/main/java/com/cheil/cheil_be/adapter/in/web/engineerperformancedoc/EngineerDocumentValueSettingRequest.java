package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

public record EngineerDocumentValueSettingRequest(
        Long bidSeq,
        String engineerId,
        Long educationId,
        Long licenseId
) {
}
