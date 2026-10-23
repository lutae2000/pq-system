package com.cheil.cheil_be.adapter.in.web.constructiontype;

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConstructionTypeUpsertRequest(
        @NotNull @Min(1) @Max(3) Integer codeLevel,
        @NotBlank @Size(max = 10) String level1Code,
        @Size(max = 10) String level2Code,
        @Size(max = 10) String level3Code,
        @NotBlank @Size(max = 100) String codeName,
        Boolean useYn,
        @Size(max = 100) String createdId,
        @Size(max = 100) String lastChangedId
) {

    public ConstructionTypeUpsertCommand toCommand() {
        return new ConstructionTypeUpsertCommand(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                useYn,
                createdId,
                lastChangedId
        );
    }
}
