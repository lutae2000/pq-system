package com.cheil.cheil_be.application.constructiontype.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.conflict;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeSearchCondition;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUseCase;
import com.cheil.cheil_be.application.constructiontype.port.out.ConstructionTypeRepository;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@Service
@RequiredArgsConstructor
public class ConstructionTypeAdminService implements ConstructionTypeUseCase {

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
        return constructionTypeRepository.findByCodeId(requiredPositive(codeId, "codeId"))
                .orElseThrow(() -> notFound("공사종류를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public ConstructionType create(ConstructionTypeUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        if (constructionTypeRepository.existsByNaturalKey(command.codeLevel(), command.level1Code(), command.level2Code(), command.level3Code())) {
            throw conflict("이미 존재하는 공사종류입니다.");
        }
        return constructionTypeRepository.save(command.toDomain(null, null, Instant.now(clock)));
    }

    @Override
    @Transactional
    public ConstructionType update(Long codeId, ConstructionTypeUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        Long normalizedCodeId = requiredPositive(codeId, "codeId");
        ConstructionType existing = findByCodeId(normalizedCodeId);
        if (constructionTypeRepository.existsByNaturalKeyAndCodeIdNot(
                command.codeLevel(),
                command.level1Code(),
                command.level2Code(),
                command.level3Code(),
                normalizedCodeId
        )) {
            throw conflict("이미 존재하는 공사종류 경로입니다.");
        }
        return constructionTypeRepository.save(command.toDomain(normalizedCodeId, existing, Instant.now(clock)));
    }

    @Override
    @Transactional
    public void delete(Long codeId) {
        Long normalizedCodeId = requiredPositive(codeId, "codeId");
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

}
