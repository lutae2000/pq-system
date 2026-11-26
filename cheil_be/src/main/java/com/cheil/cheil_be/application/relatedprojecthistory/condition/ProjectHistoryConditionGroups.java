package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.BinaryOperator;

/** Groups consecutive conditions in display order without depending on how a condition is rendered. */
public final class ProjectHistoryConditionGroups<T> {
    private final BinaryOperator<T> and;
    private final BinaryOperator<T> or;
    private final List<Group<T>> groups = new ArrayList<>();

    public ProjectHistoryConditionGroups(BinaryOperator<T> and, BinaryOperator<T> or) {
        this.and = and;
        this.or = or;
    }

    public void add(int index, String logicalOperator, Integer orGroupStart, T condition) {
        if (!"OR".equalsIgnoreCase(logicalOperator == null ? "" : logicalOperator.trim()) || groups.isEmpty()) {
            groups.add(new Group<>(index, condition));
            return;
        }

        int start = 0;
        if (orGroupStart != null) {
            while (start < groups.size() && groups.get(start).start() != orGroupStart) {
                start++;
            }
            if (start == groups.size()) {
                throw badRequest("OR로 묶을 시작 조건을 다시 선택해 주세요.");
            }
        }

        var joined = groups.subList(start, groups.size());
        var group = new Group<>(joined.getFirst().start(), or.apply(combine(joined), condition));
        joined.clear();
        groups.add(group);
    }

    public Optional<T> result() {
        return groups.isEmpty() ? Optional.empty() : Optional.of(combine(groups));
    }

    private T combine(List<Group<T>> entries) {
        T result = entries.getFirst().value();
        for (int i = 1; i < entries.size(); i++) {
            result = and.apply(result, entries.get(i).value());
        }
        return result;
    }

    private record Group<T>(int start, T value) {}
}
