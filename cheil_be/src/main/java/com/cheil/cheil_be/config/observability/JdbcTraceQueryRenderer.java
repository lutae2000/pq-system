package com.cheil.cheil_be.config.observability;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.SQLException;
import java.time.temporal.TemporalAccessor;
import java.util.HashMap;
import java.util.Map;

import net.ttddyy.dsproxy.QueryInfo;
import org.postgresql.core.NativeQuery;
import org.postgresql.core.Parser;

final class JdbcTraceQueryRenderer {
    private JdbcTraceQueryRenderer() {
    }

    static String render(QueryInfo query) {
        String sql = query.getQuery();
        if (query.getParametersList().isEmpty()) {
            return sql;
        }

        try {
            Map<Integer, Object> bindings = new HashMap<>();
            // 배치에서는 동일한 SQL의 첫 번째 파라미터 세트를 표시해 스팬 크기를 제한한다.
            query.getParametersList().getFirst().forEach(operation -> {
                Object[] args = operation.getArgs();
                if (args.length > 1 && args[0] instanceof Integer index) {
                    bindings.put(index, "setNull".equals(operation.getMethod().getName()) ? null : args[1]);
                }
            });
            if (bindings.isEmpty()) {
                return sql;
            }

            var parsedQueries = Parser.parseJdbcSql(sql, true, true, false, false, false);
            if (parsedQueries.size() != 1) {
                return sql;
            }
            return substitute(parsedQueries.getFirst(), bindings, sql);
        } catch (SQLException | RuntimeException exception) {
            return sql;
        }
    }

    private static String substitute(NativeQuery query, Map<Integer, Object> bindings, String template) {
        if (query.bindPositions.length != bindings.size()) {
            return template;
        }
        StringBuilder rendered = new StringBuilder(query.nativeSql.length());
        int offset = 0;
        for (int position = 0; position < query.bindPositions.length; position++) {
            int parameterIndex = position + 1;
            if (!bindings.containsKey(parameterIndex)) {
                return template;
            }
            int bind = query.bindPositions[position];
            rendered.append(query.nativeSql, offset, bind)
                    .append(format(bindings.get(parameterIndex)));
            offset = bind + NativeQuery.bindName(parameterIndex).length();
        }
        return rendered.append(query.nativeSql, offset, query.nativeSql.length()).toString();
    }

    private static String format(Object value) {
        return switch (value) {
            case null -> "NULL";
            case Boolean flag -> flag ? "TRUE" : "FALSE";
            case Byte number -> number.toString();
            case Short number -> number.toString();
            case Integer number -> number.toString();
            case Long number -> number.toString();
            case Float number -> Float.isFinite(number) ? number.toString() : quote(number.toString());
            case Double number -> Double.isFinite(number) ? number.toString() : quote(number.toString());
            case BigDecimal number -> number.toString();
            case BigInteger number -> number.toString();
            case String text -> quote(text);
            case java.sql.Date date -> quote(date.toString());
            case java.sql.Time time -> quote(time.toString());
            case java.sql.Timestamp timestamp -> quote(timestamp.toString());
            case TemporalAccessor temporal -> quote(temporal.toString());
            default -> "?";
        };
    }

    private static String quote(String value) {
        return "'" + value.replace("'", "''") + "'";
    }
}
