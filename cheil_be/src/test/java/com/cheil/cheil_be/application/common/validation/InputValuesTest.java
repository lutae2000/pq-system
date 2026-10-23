package com.cheil.cheil_be.application.common.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;

class InputValuesTest {

    @Test
    void validatesAndNormalizesRequiredText() {
        assertThat(InputValues.requireNonNull("value", "required")).isEqualTo("value");
        assertThatThrownBy(() -> InputValues.requireNonNull(null, "required"))
                .isInstanceOf(ApplicationException.class);
        assertThat(InputValues.requiredText(" value ", 5, "name")).isEqualTo("value");
        assertThatThrownBy(() -> InputValues.requiredText(" ", "name"))
                .isInstanceOfSatisfying(ApplicationException.class, exception -> {
                    assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST);
                    assertThat(exception.getMessage()).isEqualTo("name은(는) 필수입니다.");
                });
        assertThatThrownBy(() -> InputValues.requiredText("longer", 5, "name"))
                .isInstanceOf(ApplicationException.class);
        assertThatThrownBy(() -> InputValues.validateMaxLength("value", -1, "name"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void validatesNumbers() {
        assertThat(InputValues.requiredPositive(1L, "bidSeq")).isEqualTo(1L);
        assertThat(InputValues.requiredPositive(1, "sourceSeq")).isOne();
        assertThat(InputValues.nonNegative((BigDecimal) null, "amount")).isNull();
        assertThat(InputValues.nonNegative(BigDecimal.ZERO, "amount")).isEqualByComparingTo(BigDecimal.ZERO);
        assertThatThrownBy(() -> InputValues.requiredPositive((Long) null, "bidSeq"))
                .isInstanceOf(ApplicationException.class);
        assertThatThrownBy(() -> InputValues.nonNegative(new BigDecimal("-0.01"), "amount"))
                .isInstanceOf(ApplicationException.class);
    }

    @Test
    void normalizesAndValidatesBasicDate() {
        assertThat(InputValues.basicDate("2026-10-22", "date", true)).isEqualTo("20261022");
        assertThat(InputValues.basicDate(" ", "date", false)).isNull();
        assertThatThrownBy(() -> InputValues.basicDate("2026-02-30", "date", true))
                .isInstanceOf(ApplicationException.class);
        assertThatThrownBy(() -> InputValues.basicDate("20-2610-22", "date", true))
                .isInstanceOf(ApplicationException.class);
        assertThat(InputValues.isoDate("20261022", "date", true)).isEqualTo("2026-10-22");
    }

    @Test
    void validatesOptionalTextAndIntegerRange() {
        assertThat(InputValues.optionalText(" value ", 5, "name")).isEqualTo("value");
        assertThat(InputValues.optionalText(" ", 5, "name")).isNull();
        assertThat(InputValues.integerRange(3, 0, 4, "kind")).isEqualTo(3);
        assertThat(InputValues.digits("010-1234", 8, "phoneNo")).isEqualTo("0101234");
        assertThatThrownBy(() -> InputValues.integerRange(5, 0, 4, "kind"))
                .isInstanceOf(ApplicationException.class);
        assertThatThrownBy(() -> InputValues.integerRange(1, 2, 0, "kind"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> InputValues.digits("010-1234", 6, "phoneNo"))
                .isInstanceOf(ApplicationException.class);
    }
}
