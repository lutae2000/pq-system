package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import org.junit.jupiter.api.Test;

class ProjectHistoryConditionGroupsTest {

    @Test
    void preservesEvaluationOrderForSavedConditionsWithoutAGroupStart() {
        var groups = groups();
        groups.add(0, "AND", null, "A");
        groups.add(1, "AND", null, "B");
        groups.add(2, "OR", null, "C");
        groups.add(3, "AND", null, "D");

        assertThat(groups.result()).contains("(((A AND B) OR C) AND D)");
    }

    @Test
    void groupsOnlyTheSelectedRangeAndAllowsJoiningAnExistingGroup() {
        var groups = groups();
        groups.add(0, "AND", null, "A");
        groups.add(1, "AND", null, "B");
        groups.add(2, "OR", 1, "C");
        groups.add(3, "OR", 1, "D");

        assertThat(groups.result()).contains("(A AND ((B OR C) OR D))");
    }

    @Test
    void rejectsAGroupThatStartsInsideAnExistingOrGroup() {
        var groups = groups();
        groups.add(0, "AND", null, "A");
        groups.add(1, "OR", 0, "B");

        assertThatThrownBy(() -> groups.add(2, "OR", 1, "C"))
                .isInstanceOf(ApplicationException.class);
    }

    private static ProjectHistoryConditionGroups<String> groups() {
        return new ProjectHistoryConditionGroups<>(
                (left, right) -> "(" + left + " AND " + right + ")",
                (left, right) -> "(" + left + " OR " + right + ")");
    }
}
