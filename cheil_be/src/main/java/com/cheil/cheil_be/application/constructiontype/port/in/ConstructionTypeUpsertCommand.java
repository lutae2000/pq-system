package com.cheil.cheil_be.application.constructiontype.port.in;

import java.time.Instant;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

public record ConstructionTypeUpsertCommand(
        Integer codeLevel,
        String level1Code,
        String level2Code,
        String level3Code,
        String codeName,
        Boolean useYn,
        String createdId,
        String lastChangedId
) {

    public ConstructionTypeUpsertCommand {
        if (codeLevel == null || codeLevel < 1 || codeLevel > 3) {
            throw ApplicationException.badRequest("codeLevel은 1, 2, 3 중 하나여야 합니다.");
        }
        level1Code = InputValues.requiredText(level1Code, 10, "level1Code");
        level2Code = StringValues.normalize(level2Code);
        level3Code = StringValues.normalize(level3Code);
        codeName = InputValues.requiredText(codeName, 100, "codeName");
        createdId = optional(createdId, 100, "createdId");
        lastChangedId = optional(lastChangedId, 100, "lastChangedId");

        if (codeLevel == 1) {
            level2Code = "";
            level3Code = "";
        } else if (codeLevel == 2) {
            level2Code = InputValues.requiredText(level2Code, 10, "level2Code");
            level3Code = "";
        } else {
            level2Code = InputValues.requiredText(level2Code, 10, "level2Code");
            level3Code = InputValues.requiredText(level3Code, 10, "level3Code");
        }
    }

    public ConstructionType toDomain(Long codeId, ConstructionType existing, Instant now) {
        String resolvedCreatedId = StringValues.optional(createdId, existing == null ? "admin" : existing.createdId());
        return new ConstructionType(
                codeId, codeLevel, level1Code, level2Code, level3Code, codeName,
                useYn == null ? existing == null || existing.useYn() : useYn,
                existing == null ? now : existing.createdAt(),
                resolvedCreatedId,
                now,
                StringValues.optional(lastChangedId, resolvedCreatedId)
        );
    }

    private static String optional(String value, int maxLength, String fieldName) {
        String normalized = StringValues.trimToNull(value);
        InputValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }
}
