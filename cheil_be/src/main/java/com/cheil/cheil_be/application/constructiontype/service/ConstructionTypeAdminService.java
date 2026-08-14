package com.cheil.cheil_be.application.constructiontype.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;
import com.cheil.cheil_be.application.constructiontype.port.out.ConstructionTypeRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@Service
@RequiredArgsConstructor
public class ConstructionTypeAdminService {

    private static final int CODE_LEVEL_MIN = 1;
    private static final int CODE_LEVEL_MAX = 3;
    private static final int CODE_MAX_LENGTH = 10;
    private static final int CODE_NAME_MAX_LENGTH = 100;
    private static final int AUDIT_ID_MAX_LENGTH = 100;

    private final ConstructionTypeRepository constructionTypeRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ConstructionType> findAll(ConstructionTypeSearchCondition condition) {
        return constructionTypeRepository.findAll(condition);
    }

    @Transactional(readOnly = true)
    public ConstructionType findByCodeId(Long codeId) {
        return constructionTypeRepository.findByCodeId(requireCodeId(codeId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공사종류를 찾을 수 없습니다."));
    }

    @Transactional
    public ConstructionType create(ConstructionTypeUpsertCommand command) {
        NormalizedConstructionType normalized = normalize(command, null);
        if (constructionTypeRepository.existsByNaturalKey(normalized.codeLevel(), normalized.level1Code(), normalized.level2Code(), normalized.level3Code())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 공사종류입니다.");
        }

        Instant now = Instant.now(clock);
        ConstructionType created = new ConstructionType(
                null,
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalized.codeName(),
                normalized.useYn(),
                now,
                normalized.createdId(),
                now,
                normalized.lastChangedId()
        );
        return constructionTypeRepository.save(created);
    }

    @Transactional
    public ConstructionType update(Long codeId, ConstructionTypeUpsertCommand command) {
        Long normalizedCodeId = requireCodeId(codeId);
        ConstructionType existing = findByCodeId(normalizedCodeId);
        NormalizedConstructionType normalized = normalize(command, existing);

        if (constructionTypeRepository.existsByNaturalKeyAndCodeIdNot(
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalizedCodeId
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 공사종류 경로입니다.");
        }

        Instant now = Instant.now(clock);
        ConstructionType updated = new ConstructionType(
                normalizedCodeId,
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalized.codeName(),
                normalized.useYn(),
                existing.createdAt(),
                existing.createdId(),
                now,
                normalized.lastChangedId()
        );
        return constructionTypeRepository.save(updated);
    }

    @Transactional
    public void delete(Long codeId) {
        Long normalizedCodeId = requireCodeId(codeId);
        ConstructionType existing = findByCodeId(normalizedCodeId);
        if (hasDependentChildren(existing)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "하위 공사종류가 있어서 삭제할 수 없습니다.");
        }
        constructionTypeRepository.deleteByCodeId(normalizedCodeId);
    }

    private boolean hasDependentChildren(ConstructionType target) {
        return constructionTypeRepository.findAll().stream().anyMatch(item -> isDescendant(target, item));
    }

    private boolean isDescendant(ConstructionType parent, ConstructionType candidate) {
        if (parent.codeId() != null && parent.codeId().equals(candidate.codeId())) {
            return false;
        }

        if (parent.codeLevel() == null || candidate.codeLevel() == null) {
            return false;
        }

        if (parent.codeLevel() == 1) {
            return candidate.codeLevel() > 1 && candidate.level1Code().equals(parent.level1Code());
        }

        if (parent.codeLevel() == 2) {
            return candidate.codeLevel() == 3
                    && candidate.level1Code().equals(parent.level1Code())
                    && candidate.level2Code().equals(parent.level2Code());
        }

        return false;
    }

    private NormalizedConstructionType normalize(ConstructionTypeUpsertCommand command, ConstructionType existing) {
        if (command == null) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        Integer codeLevel = command.codeLevel();
        if (codeLevel == null || codeLevel < CODE_LEVEL_MIN || codeLevel > CODE_LEVEL_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "codeLevel은 1, 2, 3 중 하나여야 합니다.");
        }

        String level1Code = StringValues.required(command.level1Code(), "level1Code");
        String level2Code = StringValues.normalize(command.level2Code());
        String level3Code = StringValues.normalize(command.level3Code());
        String codeName = StringValues.required(command.codeName(), "codeName");
        boolean useYn = command.useYn() == null ? existing == null || existing.useYn() : command.useYn();
        String createdId = StringValues.optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = StringValues.optional(command.lastChangedId(), createdId);

        validateLengths(level1Code, level2Code, level3Code, codeName, createdId, lastChangedId);

        if (codeLevel == 1) {
            level2Code = "";
            level3Code = "";
        } else if (codeLevel == 2) {
            level2Code = StringValues.required(level2Code, "level2Code");
            level3Code = "";
        } else {
            level2Code = StringValues.required(level2Code, "level2Code");
            level3Code = StringValues.required(level3Code, "level3Code");
        }

        return new NormalizedConstructionType(codeLevel, level1Code, level2Code, level3Code, codeName, useYn, createdId, lastChangedId);
    }

    private void validateLengths(String level1Code, String level2Code, String level3Code, String codeName, String createdId, String lastChangedId) {
        StringValues.validateMaxLength(level1Code, CODE_MAX_LENGTH, "level1Code");
        StringValues.validateMaxLength(level2Code, CODE_MAX_LENGTH, "level2Code");
        StringValues.validateMaxLength(level3Code, CODE_MAX_LENGTH, "level3Code");
        StringValues.validateMaxLength(codeName, CODE_NAME_MAX_LENGTH, "codeName");
        StringValues.validateMaxLength(createdId, AUDIT_ID_MAX_LENGTH, "createdId");
        StringValues.validateMaxLength(lastChangedId, AUDIT_ID_MAX_LENGTH, "lastChangedId");
    }

    private Long requireCodeId(Long codeId) {
        if (codeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "codeId는 필수입니다.");
        }
        return codeId;
    }

    private record NormalizedConstructionType(
            Integer codeLevel,
            String level1Code,
            String level2Code,
            String level3Code,
            String codeName,
            boolean useYn,
            String createdId,
            String lastChangedId
    ) {
    }
}
