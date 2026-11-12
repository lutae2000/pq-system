package com.cheil.batch.common.logging;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PrettySqlLogMessageFormatTest {
    private final PrettySqlLogMessageFormat formatter = new PrettySqlLogMessageFormat();

    @Test
    void formatsBoundSqlAcrossMultipleLines() {
        String message = formatter.formatMessage(1, "", 24, "statement", "",
                "DELETE FROM g2b_bid_notice_candidates WHERE first_seen_at < CURRENT_TIMESTAMP - (3 * INTERVAL '1 month')", "");

        assertThat(message).contains("3 * INTERVAL '1 month'");
        assertThat(message).contains("SQL [statement, 24ms, connection 1]:\n");
        assertThat(message.lines().count()).isGreaterThan(2);
    }
}
