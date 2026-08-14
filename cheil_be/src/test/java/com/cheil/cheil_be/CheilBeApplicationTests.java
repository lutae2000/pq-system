package com.cheil.cheil_be;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CheilBeApplicationTests {

    @Test
    void mainClassCanBeLoaded() {
        assertThat(CheilBeApplication.class).isNotNull();
    }
}
