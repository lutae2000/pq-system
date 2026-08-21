package com.cheil.cheil_be.config.jpa;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.time.temporal.TemporalAccessor;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import net.ttddyy.observation.tracing.QueryContext;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Profile({ "local", "dev" })
public class CompletedQueryLoggingDataSourcePostProcessor implements BeanPostProcessor {

    private static final Logger log = LoggerFactory.getLogger("SQL_COMPLETED");
    private final ObjectProvider<ObservationRegistry> observationRegistryProvider;

    public CompletedQueryLoggingDataSourcePostProcessor(ObjectProvider<ObservationRegistry> observationRegistryProvider) {
        this.observationRegistryProvider = observationRegistryProvider;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource dataSource && !Proxy.isProxyClass(bean.getClass())) {
            return JdbcLoggingProxy.wrap(dataSource, observationRegistryProvider.getIfAvailable());
        }
        return bean;
    }

    private static final class JdbcLoggingProxy {

        private static ObservationRegistry observationRegistry;

        private static final Set<String> STATEMENT_SQL_METHODS = Set.of(
                "execute",
                "executeQuery",
                "executeUpdate",
                "executeLargeUpdate",
                "addBatch"
        );
        private static final Set<String> PREPARED_EXECUTE_METHODS = Set.of(
                "execute",
                "executeQuery",
                "executeUpdate",
                "executeLargeUpdate",
                "executeBatch"
        );
        private static final Object MISSING_VALUE = new Object();

        private JdbcLoggingProxy() {
        }

        static DataSource wrap(DataSource target, ObservationRegistry registry) {
            observationRegistry = registry;
            return (DataSource) Proxy.newProxyInstance(
                    DataSource.class.getClassLoader(),
                    new Class<?>[] { DataSource.class },
                    new DataSourceHandler(target)
            );
        }

        private static Connection wrap(Connection target) {
            return (Connection) Proxy.newProxyInstance(
                    Connection.class.getClassLoader(),
                    new Class<?>[] { Connection.class },
                    new ConnectionHandler(target)
            );
        }

        private static Statement wrap(Statement target) {
            return (Statement) Proxy.newProxyInstance(
                    Statement.class.getClassLoader(),
                    new Class<?>[] { Statement.class },
                    new StatementHandler(target)
            );
        }

        private static PreparedStatement wrap(PreparedStatement target, String sql) {
            Class<?> statementType = target instanceof CallableStatement ? CallableStatement.class : PreparedStatement.class;
            return (PreparedStatement) Proxy.newProxyInstance(
                    statementType.getClassLoader(),
                    new Class<?>[] { statementType },
                    new PreparedStatementHandler(target, sql)
            );
        }

        private static Object invoke(Object target, Method method, Object[] args) throws Throwable {
            try {
                return method.invoke(target, args);
            } catch (InvocationTargetException ex) {
                throw ex.getTargetException();
            }
        }

        private static void logSql(String sql) {
            if (log.isDebugEnabled() && shouldLog(sql)) {
                String formattedSql = formatSql(sql);
                recordCompletedQuery(formattedSql);
                log.debug(formattedSql);
            }
        }

        private static void logSql(String sql, Map<Integer, Object> parameters) {
            if (log.isDebugEnabled() && shouldLog(sql)) {
                String formattedSql = formatSql(render(sql, parameters));
                recordCompletedQuery(formattedSql);
                log.debug(formattedSql);
            }
        }

        private static void recordCompletedQuery(String sql) {
            Observation currentObservation = observationRegistry == null ? null : observationRegistry.getCurrentObservation();
            if (currentObservation != null && currentObservation.getContext() instanceof QueryContext queryContext) {
                queryContext.setQueries(java.util.List.of(sql));
            }
        }

        private static boolean shouldLog(String sql) {
            return !sql.toLowerCase(java.util.Locale.ROOT).contains("api_call_logs");
        }

        private static String formatSql(String sql) {
            String normalized = normalizeWhitespace(sql);
            String formatted = normalized;

            for (SqlKeywordReplacement replacement : SqlKeywordReplacement.values()) {
                formatted = replacement.apply(formatted);
            }

            return formatted;
        }

        private static String normalizeWhitespace(String sql) {
            StringBuilder normalized = new StringBuilder(sql.length());
            boolean inSingleQuote = false;
            boolean pendingSpace = false;

            for (int index = 0; index < sql.length(); index++) {
                char current = sql.charAt(index);

                if (current == '\'') {
                    normalized.append(current);
                    if (index + 1 < sql.length() && sql.charAt(index + 1) == '\'') {
                        normalized.append(sql.charAt(++index));
                    } else {
                        inSingleQuote = !inSingleQuote;
                    }
                    pendingSpace = false;
                    continue;
                }

                if (!inSingleQuote && Character.isWhitespace(current)) {
                    pendingSpace = normalized.length() > 0;
                    continue;
                }

                if (pendingSpace && normalized.length() > 0 && normalized.charAt(normalized.length() - 1) != '\n') {
                    normalized.append(' ');
                }
                pendingSpace = false;
                normalized.append(current);
            }

            return normalized.toString().trim();
        }

        private enum SqlKeywordReplacement {
            ORDER_BY("(?i)\\s+ORDER\\s+BY\\b", "\nORDER BY"),
            GROUP_BY("(?i)\\s+GROUP\\s+BY\\b", "\nGROUP BY"),
            LEFT_JOIN("(?i)\\s+LEFT\\s+JOIN\\b", "\nLEFT JOIN"),
            RIGHT_JOIN("(?i)\\s+RIGHT\\s+JOIN\\b", "\nRIGHT JOIN"),
            INNER_JOIN("(?i)\\s+INNER\\s+JOIN\\b", "\nINNER JOIN"),
            FULL_JOIN("(?i)\\s+FULL\\s+JOIN\\b", "\nFULL JOIN"),
            JOIN("(?i)\\s+JOIN\\b", "\nJOIN"),
            WHERE("(?i)\\s+WHERE\\b", "\nWHERE"),
            HAVING("(?i)\\s+HAVING\\b", "\nHAVING"),
            VALUES("(?i)\\s+VALUES\\b", "\nVALUES"),
            SET("(?i)\\s+SET\\b", "\nSET"),
            FROM("(?i)\\s+FROM\\b", "\nFROM"),
            AND("(?i)\\s+AND\\b", "\n  AND"),
            OR("(?i)\\s+OR\\b", "\n  OR");

            private final java.util.regex.Pattern pattern;
            private final String replacement;

            SqlKeywordReplacement(String regex, String replacement) {
                this.pattern = java.util.regex.Pattern.compile(regex);
                this.replacement = replacement;
            }

            String apply(String sql) {
                return pattern.matcher(sql).replaceAll(replacement);
            }
        }

        private static String render(String sql, Map<Integer, Object> parameters) {
            StringBuilder rendered = new StringBuilder(sql.length() + parameters.size() * 8);
            boolean inSingleQuote = false;
            int parameterIndex = 1;

            for (int index = 0; index < sql.length(); index++) {
                char current = sql.charAt(index);
                if (current == '\'') {
                    rendered.append(current);
                    if (index + 1 < sql.length() && sql.charAt(index + 1) == '\'') {
                        rendered.append(sql.charAt(++index));
                    } else {
                        inSingleQuote = !inSingleQuote;
                    }
                    continue;
                }
                if (current == '?' && !inSingleQuote) {
                    Object value = parameters.getOrDefault(parameterIndex++, MISSING_VALUE);
                    rendered.append(value == MISSING_VALUE ? "?" : format(value));
                    continue;
                }
                rendered.append(current);
            }
            return rendered.toString();
        }

        private static String format(Object value) {
            return switch (value) {
                case null -> "NULL";
                case Number number -> number.toString();
                case Boolean bool -> bool.toString();
                case byte[] bytes -> quote("<%d bytes>".formatted(bytes.length));
                case java.sql.Date sqlDate -> quote(sqlDate.toLocalDate().toString());
                case java.sql.Timestamp timestamp -> quote(timestamp.toInstant().toString());
                case java.util.Date date -> quote(Instant.ofEpochMilli(date.getTime()).toString());
                case TemporalAccessor temporal -> quote(temporal.toString());
                default -> quote(String.valueOf(value));
            };
        }

        private static String quote(String value) {
            String text = value.length() > 500 ? value.substring(0, 500) + "..." : value;
            return "'" + text.replace("'", "''") + "'";
        }

        private record DataSourceHandler(DataSource target) implements InvocationHandler {

            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                if ("getConnection".equals(method.getName())) {
                    return wrap((Connection) JdbcLoggingProxy.invoke(target, method, args));
                }
                if ("unwrap".equals(method.getName()) && args != null && args.length == 1 && args[0] instanceof Class<?> type) {
                    if (type.isInstance(proxy)) {
                        return proxy;
                    }
                }
                return JdbcLoggingProxy.invoke(target, method, args);
            }
        }

        private record ConnectionHandler(Connection target) implements InvocationHandler {

            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                Object result = JdbcLoggingProxy.invoke(target, method, args);
                if (result instanceof PreparedStatement preparedStatement
                        && args != null
                        && args.length > 0
                        && args[0] instanceof String sql) {
                    return wrap(preparedStatement, sql);
                }
                if (result instanceof Statement statement && "createStatement".equals(method.getName())) {
                    return wrap(statement);
                }
                return result;
            }
        }

        private record StatementHandler(Statement target) implements InvocationHandler {

            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                if (STATEMENT_SQL_METHODS.contains(method.getName())
                        && args != null
                        && args.length > 0
                        && args[0] instanceof String sql) {
                    logSql(sql);
                }
                return JdbcLoggingProxy.invoke(target, method, args);
            }
        }

        private static final class PreparedStatementHandler implements InvocationHandler {

            private final PreparedStatement target;
            private final String sql;
            private final Map<Integer, Object> parameters = new TreeMap<>();

            private PreparedStatementHandler(PreparedStatement target, String sql) {
                this.target = target;
                this.sql = sql;
            }

            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                String methodName = method.getName();
                if ("setNull".equals(methodName) && args != null && args.length > 0 && args[0] instanceof Integer index) {
                    parameters.put(index, null);
                } else if (methodName.startsWith("set")
                        && args != null
                        && args.length > 1
                        && args[0] instanceof Integer index) {
                    parameters.put(index, args[1]);
                } else if ("clearParameters".equals(methodName)) {
                    parameters.clear();
                } else if (PREPARED_EXECUTE_METHODS.contains(methodName)) {
                    logSql(sql, parameters);
                }
                return JdbcLoggingProxy.invoke(target, method, args);
            }
        }
    }
}
