package com.cheil.cheil_be.application.commoncode.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.cheil.cheil_be.application.commoncode.port.in.CommonCodeSearchCondition;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Component
public class CommonCodeSearchSupport {

    public List<CommonCode> filter(List<CommonCode> commonCodes, CommonCodeSearchCondition condition) {
        String keyword = StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);
        Boolean useYn = condition.useYn();
        Integer codeLevel = condition.codeLevel();
        String level1Code = StringValues.normalize(condition.level1Code());
        String level2Code = StringValues.normalize(condition.level2Code());
        String level2CodePrefix = StringValues.normalize(condition.level2CodePrefix());
        String level3Code = trimNullable(condition.level3Code());
        String refValue1Contains = StringValues.normalize(condition.refValue1Contains());
        String sort = StringValues.normalize(condition.sort());

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
}
