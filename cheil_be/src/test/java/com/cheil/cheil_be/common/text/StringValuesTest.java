package com.cheil.cheil_be.common.text;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class StringValuesTest {

    @Test
    void normalizesBlankAndOptionalValuesConsistently() {
        assertThat(StringValues.normalize("  value  ")).isEqualTo("value");
        assertThat(StringValues.normalize("   ")).isEmpty();
        assertThat(StringValues.trimToNull("  value  ")).isEqualTo("value");
        assertThat(StringValues.trimToNull("   ")).isNull();
        assertThat(StringValues.trimToNull(null)).isNull();
        assertThat(StringValues.optional("  value  ", "fallback")).isEqualTo("value");
        assertThat(StringValues.optional("   ", "fallback")).isEqualTo("fallback");
        assertThat(StringValues.optional(null, null)).isNull();
        assertThat(StringValues.emptyIfNull(null)).isEmpty();
        assertThat(StringValues.emptyIfNull(" value ")).isEqualTo(" value ");
    }

    @Test
    void checksContainedTextIgnoringCaseAndHandlesNull() {
        assertThat(StringValues.containsIgnoreCase("Common Code", "code")).isTrue();
        assertThat(StringValues.containsIgnoreCase("Common Code", "user")).isFalse();
        assertThat(StringValues.containsIgnoreCase(null, "code")).isFalse();
        assertThat(StringValues.containsIgnoreCase("Common Code", " ")).isTrue();
    }

    @Test
    void keepsOnlyAsciiDigits() {
        assertThat(StringValues.digitsOnly("010-1234 5678")).isEqualTo("01012345678");
        assertThat(StringValues.digitsOnly(" ")).isEmpty();
        assertThat(StringValues.digitsOnly(null)).isEmpty();
    }
}
