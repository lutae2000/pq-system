package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.sql.Timestamp;

public record EngineerDocumentValueSettingResponse(
        Long bidSeq,
        String engineerId,
        Long educationId,
        Long licenseId,
        Timestamp createdAt,
        String createdId,
        Timestamp lastChangedAt,
        String lastChangedId
) {
}
