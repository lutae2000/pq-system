package com.cheil.batch.common.logging;

import com.github.vertical_blank.sqlformatter.SqlFormatter;
import com.github.vertical_blank.sqlformatter.languages.Dialect;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

/** Formats bound JDBC SQL for local debugging across all batch jobs. */
public final class PrettySqlLogMessageFormat implements MessageFormattingStrategy {
    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category,
                                String prepared, String sql, String url) {
        if (sql == null || sql.isBlank()) {
            return "";
        }
        return "SQL [" + category + ", " + elapsed + "ms, connection " + connectionId + "]:\n"
                + SqlFormatter.of(Dialect.PostgreSql).format(sql).strip();
    }
}
