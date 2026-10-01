package com.cheil.cheil_be.application.constructiontype.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.constructiontype.exception.ConstructionTypeApplicationException;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUseCase;
import com.cheil.cheil_be.application.constructiontype.port.out.ConstructionTypeRepository;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@Service
@RequiredArgsConstructor
public class ConstructionTypeAdminService implements ConstructionTypeUseCase {

    private static final int CODE_LEVEL_MIN = 1;
    private static final int CODE_LEVEL_MAX = 3;
    private static final int CODE_MAX_LENGTH = 10;
    private static final int CODE_NAME_MAX_LENGTH = 100;
    private static final int AUDIT_ID_MAX_LENGTH = 100;

    private final ConstructionTypeRepository constructionTypeRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<ConstructionType> findAll(ConstructionTypeSearchCondition condition) {
        return constructionTypeRepository.findAll(condition);
    }

    @Override
    @Transactional(readOnly = true)
    public ConstructionType findByCodeId(Long codeId) {
        return constructionTypeRepository.findByCodeId(requireCodeId(codeId))
                .orElseThrow(() -> notFound("공사종류를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public ConstructionType create(ConstructionTypeUpsertCommand command) {
        NormalizedConstructionType normalized = normalize(command, null);
        if (constructionTypeRepository.existsByNaturalKey(normalized.codeLevel(), normalized.level1Code(), normalized.level2Code(), normalized.level3Code())) {
            throw conflict("이미 존재하는 공사종류입니다.");
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

    @Override
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
            throw conflict("이미 존재하는 공사종류 경로입니다.");
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

    @Override
    @Transactional
    public void delete(Long codeId) {
        Long normalizedCodeId = requireCodeId(codeId);
        ConstructionType existing = findByCodeId(normalizedCodeId);
        if (hasDependentChildren(existing)) {
            throw conflict("하위 공사종류가 있어서 삭제할 수 없습니다.");
        }
        constructionTypeRepository.deleteByCodeId(normalizedCodeId);
    }

    private boolean hasDependentChildren(ConstructionType target) {
        // 현재 repository 계약은 전체 목록만 제공하므로 application에서 같은 계층 경로를 비교합니다.
        // 1단계는 2·3단계 전체, 2단계는 해당 3단계만 자식으로 판단해 부모 삭제를 막습니다.
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
            throw badRequest("요청 본문이 필요합니다.");
        }

        Integer codeLevel = command.codeLevel();
        if (codeLevel == null || codeLevel < CODE_LEVEL_MIN || codeLevel > CODE_LEVEL_MAX) {
            throw badRequest("codeLevel은 1, 2, 3 중 하나여야 합니다.");
        }

        // 계층별로 허용되는 코드만 남겨 natural key 중복 검사와 저장값을 동일하게 유지합니다.
        String level1Code = required(command.level1Code(), "level1Code");
        String level2Code = normalize(command.level2Code());
        String level3Code = normalize(command.level3Code());
        String codeName = required(command.codeName(), "codeName");
        boolean useYn = command.useYn() == null ? existing == null || existing.useYn() : command.useYn();
        String createdId = optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = optional(command.lastChangedId(), createdId);

        validateLengths(level1Code, level2Code, level3Code, codeName, createdId, lastChangedId);

        if (codeLevel == 1) {
            level2Code = "";
            level3Code = "";
        } else if (codeLevel == 2) {
            level2Code = required(level2Code, "level2Code");
            level3Code = "";
        } else {
            level2Code = required(level2Code, "level2Code");
            level3Code = required(level3Code, "level3Code");
        }

        return new NormalizedConstructionType(codeLevel, level1Code, level2Code, level3Code, codeName, useYn, createdId, lastChangedId);
    }

    private void validateLengths(String level1Code, String level2Code, String level3Code, String codeName, String createdId, String lastChangedId) {
        validateMaxLength(level1Code, CODE_MAX_LENGTH, "level1Code");
        validateMaxLength(level2Code, CODE_MAX_LENGTH, "level2Code");
        validateMaxLength(level3Code, CODE_MAX_LENGTH, "level3Code");
        validateMaxLength(codeName, CODE_NAME_MAX_LENGTH, "codeName");
        validateMaxLength(createdId, AUDIT_ID_MAX_LENGTH, "createdId");
        validateMaxLength(lastChangedId, AUDIT_ID_MAX_LENGTH, "lastChangedId");
    }

    private Long requireCodeId(Long codeId) {
        if (codeId == null) {
            throw badRequest("codeId는 필수입니다.");
        }
        return codeId;
    }

    /** 입력값은 저장 전에 한 번만 정리해 계층 코드 비교와 중복 검사를 같은 기준으로 수행합니다. */
    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized.isEmpty()) {
            throw badRequest(fieldName + "은(는) 필수입니다.");
        }
        return normalized;
    }

    private String optional(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? fallback : normalized;
    }

    private void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value.length() > maxLength) {
            throw badRequest(fieldName + "은(는) " + maxLength + "자 이하이어야 합니다.");
        }
    }

    private ConstructionTypeApplicationException badRequest(String message) {
        return new ConstructionTypeApplicationException(ConstructionTypeApplicationException.Type.BAD_REQUEST, message);
    }

    private ConstructionTypeApplicationException conflict(String message) {
        return new ConstructionTypeApplicationException(ConstructionTypeApplicationException.Type.CONFLICT, message);
    }

    private ConstructionTypeApplicationException notFound(String message) {
        return new ConstructionTypeApplicationException(ConstructionTypeApplicationException.Type.NOT_FOUND, message);
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
