package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.common.exception.ApplicationException;

class ProjectHistoryConditionJsonCodecTest {

    private final ProjectHistoryConditionJsonCodec codec = new ProjectHistoryConditionJsonCodec();

    @Test
    void parsesAndNormalizesConditionArray() {
        String json = "[{\"conditionType\":\"general\",\"operator\":\">=\",\"value\":\"10\"}]";

        assertThat(codec.parse(json)).hasSize(1);
        assertThat(codec.normalize(json)).contains("\"conditionType\":\"general\"");
        assertThat(codec.normalize(" ")).isEqualTo("[]");
    }

    @Test
    void rejectsMalformedJson() {
        assertThatThrownBy(() -> codec.parse("not-json"))
                .isInstanceOf(ApplicationException.class);
    }
}
