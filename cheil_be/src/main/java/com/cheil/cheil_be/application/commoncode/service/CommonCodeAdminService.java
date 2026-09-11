package com.cheil.cheil_be.application.commoncode.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeSearchCondition;
import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeUpsertCommand;
import com.cheil.cheil_be.application.commoncode.port.out.CommonCodeRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommonCodeAdminService {

    private static final int CODE_LEVEL_MIN = 1;
    private static final int CODE_LEVEL_MAX = 3;
    private static final int CODE_MAX_LENGTH = 20;
    private static final int CODE_NAME_MAX_LENGTH = 200;
    private static final int REMARK_MAX_LENGTH = 500;
    private static final int REF_VALUE_MAX_LENGTH = 500;
    private static final int AUDIT_ID_MAX_LENGTH = 100;
    private static final String ROOT_LEVEL1_CODE = "999";

    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeCacheService commonCodeCacheService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<CommonCode> findAll(CommonCodeSearchCondition condition) {
        String keyword = StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);
        Boolean useYn = condition.useYn();
        Integer codeLevel = condition.codeLevel();
        String level1Code = StringValues.normalize(condition.level1Code());
        String level2Code = StringValues.normalize(condition.level2Code());
        String level2CodePrefix = StringValues.normalize(condition.level2CodePrefix());
        String level3Code = trimNullable(condition.level3Code());
        String refValue1Contains = StringValues.normalize(condition.refValue1Contains());
        String sort = StringValues.normalize(condition.sort());
        List<CommonCode> commonCodes = condition.bypassCache()
                ? findDirectCommonCodes(codeLevel, level1Code, level2Code, useYn)
                : findCachedCommonCodes(codeLevel, level1Code, level2Code, useYn);

        return commonCodes.stream()
                .filter(item -> matchesKeyword(item, keyword))
                .filter(item -> useYn == null || item.useYn() == useYn)
                .filter(item -> codeLevel == null || codeLevel.equals(item.codeLevel()))
                .filter(item -> matchesLevel1Code(item, level1Code))
                .filter(item -> matchesLevel2Code(item, level2Code))
                .filter(item -> matchesLevel2CodePrefix(item, level2CodePrefix))
                .filter(item -> matchesLevel3Code(item, level3Code))
                .filter(item -> matchesRefValue1Contains(item, refValue1Contains))
                .sorted(resolveComparator(sort))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<List<CommonCode>> findAllBatch(List<CommonCodeSearchCondition> conditions) {
        return conditions.stream().map(this::findAll).toList();
    }

    private List<CommonCode> findCachedCommonCodes(Integer codeLevel, String level1Code, String level2Code, Boolean useYn) {
        if (level1Code != null && !level1Code.isBlank() && level2Code != null && !level2Code.isBlank()) {
            return commonCodeCacheService.getOrLoadByLevel2Code(
                    level1Code,
                    level2Code,
                    useYn,
                    () -> commonCodeRepository.findAllByLevel1CodeAndLevel2Code(level1Code, level2Code, useYn)
            );
        }

        if (level1Code != null && !level1Code.isBlank()) {
            return commonCodeCacheService.getOrLoadByLevel1Code(
                    level1Code,
                    useYn,
                    () -> commonCodeRepository.findAllByLevel1Code(level1Code, useYn)
            );
        }

        if (codeLevel != null) {
            return commonCodeRepository.findAllByCodeLevel(codeLevel, useYn);
        }

        return commonCodeCacheService.getOrLoadAll(commonCodeRepository::findAll);
    }

    private List<CommonCode> findDirectCommonCodes(Integer codeLevel, String level1Code, String level2Code, Boolean useYn) {
        if (level1Code != null && !level1Code.isBlank() && level2Code != null && !level2Code.isBlank()) {
            return commonCodeRepository.findAllByLevel1CodeAndLevel2Code(level1Code, level2Code, useYn);
        }

        if (level1Code != null && !level1Code.isBlank()) {
            return commonCodeRepository.findAllByLevel1Code(level1Code, useYn);
        }

        if (codeLevel != null) {
            return commonCodeRepository.findAllByCodeLevel(codeLevel, useYn);
        }

        return commonCodeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public CommonCode findByCodeId(Long codeId) {
        Long normalizedCodeId = requireCodeId(codeId);
        return commonCodeCacheService.getOrLoadById(
                        normalizedCodeId,
                        () -> commonCodeRepository.findByCodeId(normalizedCodeId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Common code not found."));
    }

    @Transactional
    public CommonCode create(CommonCodeUpsertCommand command) {
        NormalizedCommonCode normalized = normalize(command, null);
        if (commonCodeRepository.existsByNaturalKey(
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code()
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Common code already exists.");
        }

        Instant now = Instant.now(clock);
        CommonCode created = new CommonCode(
                null,
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalized.codeName(),
                normalized.codeDetailName(),
                normalized.refValue1(),
                normalized.sortOrder(),
                normalized.remark(),
                normalized.useYn(),
                now,
                normalized.createdId(),
                now,
                normalized.lastChangedId()
        );
        CommonCode saved = commonCodeRepository.save(created);
        commonCodeCacheService.evictAfterCommit(saved);
        return saved;
    }

    @Transactional
    public CommonCode update(Long codeId, CommonCodeUpsertCommand command) {
        Long normalizedCodeId = requireCodeId(codeId);
        CommonCode existing = findByCodeId(normalizedCodeId);
        NormalizedCommonCode normalized = normalize(command, existing);

        if (commonCodeRepository.existsByNaturalKeyAndCodeIdNot(
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalizedCodeId
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Common code path already exists.");
        }

        Instant now = Instant.now(clock);
        CommonCode updated = new CommonCode(
                normalizedCodeId,
                normalized.codeLevel(),
                normalized.level1Code(),
                normalized.level2Code(),
                normalized.level3Code(),
                normalized.codeName(),
                normalized.codeDetailName(),
                normalized.refValue1(),
                normalized.sortOrder(),
                normalized.remark(),
                normalized.useYn(),
                existing.createdAt(),
                existing.createdId(),
                now,
                normalized.lastChangedId()
        );
        CommonCode saved = commonCodeRepository.save(updated);
        commonCodeCacheService.evictAfterCommit(existing, saved);
        return saved;
    }

    @Transactional
    public void delete(Long codeId) {
        Long normalizedCodeId = requireCodeId(codeId);
        CommonCode existing = findByCodeId(normalizedCodeId);
        if (hasDependentChildren(existing)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete a common code with child codes.");
        }
        commonCodeRepository.deleteByCodeId(normalizedCodeId);
        commonCodeCacheService.evictAfterCommit(existing);
    }

    private boolean hasDependentChildren(CommonCode target) {
        return commonCodeRepository.findAll().stream().anyMatch(item -> isDescendant(target, item));
    }

    private boolean isDescendant(CommonCode parent, CommonCode candidate) {
        if (parent.codeId() != null && parent.codeId().equals(candidate.codeId())) {
            return false;
        }

        if (parent.codeLevel() == null || candidate.codeLevel() == null) {
            return false;
        }

        if (parent.codeLevel() == 1) {
            return candidate.codeLevel() > 1 && parent.level2Code().equals(candidate.level1Code());
        }

        if (parent.codeLevel() == 2) {
            return candidate.codeLevel() == 3
                    && parent.level1Code().equals(candidate.level1Code())
                    && parent.level2Code().equals(candidate.level2Code());
        }

        return false;
    }

    private NormalizedCommonCode normalize(CommonCodeUpsertCommand command, CommonCode existing) {
        if (command == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        Integer codeLevel = command.codeLevel();
        if (codeLevel == null || codeLevel < CODE_LEVEL_MIN || codeLevel > CODE_LEVEL_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "codeLevel must be 1, 2, or 3.");
        }

        String level1Code = StringValues.required(command.level1Code(), "level1Code");
        String level2Code = StringValues.normalize(command.level2Code());
        String level3Code = StringValues.normalize(command.level3Code());
        String codeName = StringValues.required(command.codeName(), "codeName");
        String codeDetailName = StringValues.normalize(command.codeDetailName());
        String refValue1 = StringValues.normalize(command.refValue1());
        String remark = StringValues.normalize(command.remark());
        Integer sortOrder = command.sortOrder() == null ? 0 : command.sortOrder();
        boolean useYn = command.useYn() == null ? existing == null || existing.useYn() : command.useYn();
        String createdId = StringValues.optional(command.createdId(), existing == null ? "admin" : existing.createdId());
        String lastChangedId = StringValues.optional(command.lastChangedId(), createdId);

        if (codeLevel == 1) {
            level2Code = level1Code;
            level1Code = ROOT_LEVEL1_CODE;
            level3Code = "";
            codeDetailName = "";
        } else if (codeLevel == 2) {
            level2Code = StringValues.required(level2Code, "level2Code");
            level3Code = "";
            codeDetailName = "";
        } else {
            level2Code = StringValues.required(level2Code, "level2Code");
            level3Code = StringValues.required(level3Code, "level3Code");
        }

        validateLengths(level1Code, level2Code, level3Code, codeName, codeDetailName, refValue1, remark, createdId, lastChangedId);
        return new NormalizedCommonCode(
                codeLevel,
                level1Code,
                level2Code,
                level3Code,
                codeName,
                codeDetailName,
                refValue1,
                sortOrder,
                remark,
                useYn,
                createdId,
                lastChangedId
        );
    }

    private void validateLengths(
            String level1Code,
            String level2Code,
            String level3Code,
            String codeName,
            String codeDetailName,
            String refValue1,
            String remark,
            String createdId,
            String lastChangedId
    ) {
        StringValues.validateMaxLength(level1Code, CODE_MAX_LENGTH, "level1Code");
        StringValues.validateMaxLength(level2Code, CODE_MAX_LENGTH, "level2Code");
        StringValues.validateMaxLength(level3Code, CODE_MAX_LENGTH, "level3Code");
        StringValues.validateMaxLength(codeName, CODE_NAME_MAX_LENGTH, "codeName");
        StringValues.validateMaxLength(codeDetailName, CODE_NAME_MAX_LENGTH, "codeDetailName");
        StringValues.validateMaxLength(refValue1, REF_VALUE_MAX_LENGTH, "refValue1");
        StringValues.validateMaxLength(remark, REMARK_MAX_LENGTH, "remark");
        StringValues.validateMaxLength(createdId, AUDIT_ID_MAX_LENGTH, "createdId");
        StringValues.validateMaxLength(lastChangedId, AUDIT_ID_MAX_LENGTH, "lastChangedId");
    }

    private boolean matchesKeyword(CommonCode item, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        return contains(item.codeId() == null ? "" : String.valueOf(item.codeId()), keyword)
                || contains(item.codeLevel() == null ? "" : String.valueOf(item.codeLevel()), keyword)
                || contains(item.level1Code(), keyword)
                || contains(item.level2Code(), keyword)
                || contains(item.level3Code(), keyword)
                || contains(item.codeName(), keyword)
                || contains(item.codeDetailName(), keyword)
                || contains(item.refValue1(), keyword)
                || contains(item.remark(), keyword)
                || contains(item.createdId(), keyword)
                || contains(item.lastChangedId(), keyword);
    }

    private boolean matchesLevel1Code(CommonCode item, String level1Code) {
        if (level1Code == null || level1Code.isBlank()) {
            return true;
        }

        if (item.codeLevel() != null && item.codeLevel() == 1) {
            return level1Code.equals(item.level2Code());
        }

        return level1Code.equals(item.level1Code());
    }

    private boolean matchesLevel2Code(CommonCode item, String level2Code) {
        if (level2Code == null || level2Code.isBlank()) {
            return true;
        }

        return level2Code.equals(item.level2Code());
    }

    private boolean matchesLevel2CodePrefix(CommonCode item, String level2CodePrefix) {
        if (level2CodePrefix == null || level2CodePrefix.isBlank()) {
            return true;
        }

        return item.level2Code() != null && item.level2Code().startsWith(level2CodePrefix);
    }

    private boolean matchesLevel3Code(CommonCode item, String level3Code) {
        if (level3Code == null) {
            return true;
        }

        return level3Code.equals(item.level3Code() == null ? "" : item.level3Code());
    }

    private boolean matchesRefValue1Contains(CommonCode item, String refValue1Contains) {
        if (refValue1Contains == null || refValue1Contains.isBlank()) {
            return true;
        }

        return item.refValue1() != null && item.refValue1().contains(refValue1Contains);
    }

    private Comparator<CommonCode> resolveComparator(String sort) {
        Comparator<CommonCode> baseComparator = Comparator.comparing(CommonCode::codeLevel)
                .thenComparing(CommonCode::level1Code);

        if ("level3Code".equalsIgnoreCase(sort)) {
            return baseComparator
                    .thenComparing(CommonCode::level2Code)
                    .thenComparing(CommonCode::level3Code)
                    .thenComparing(CommonCode::codeId, Comparator.nullsLast(Comparator.naturalOrder()));
        }

        return baseComparator
                .thenComparing(CommonCode::sortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CommonCode::level2Code)
                .thenComparing(CommonCode::level3Code)
                .thenComparing(CommonCode::codeId, Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private String trimNullable(String value) {
        return value == null ? null : value.trim();
    }

    private boolean contains(String value, String keyword) {
        return value != null && StringValues.containsIgnoreCase(value, keyword);
    }

    private Long requireCodeId(Long codeId) {
        if (codeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "codeId is required.");
        }
        return codeId;
    }

    private record NormalizedCommonCode(
            Integer codeLevel,
            String level1Code,
            String level2Code,
            String level3Code,
            String codeName,
            String codeDetailName,
            String refValue1,
            Integer sortOrder,
            String remark,
            boolean useYn,
            String createdId,
            String lastChangedId
    ) {
    }
}
