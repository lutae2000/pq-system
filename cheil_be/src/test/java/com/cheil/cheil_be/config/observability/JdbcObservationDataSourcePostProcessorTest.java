package com.cheil.cheil_be.config.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import net.ttddyy.observation.tracing.QueryContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;

class JdbcObservationDataSourcePostProcessorTest {

    @Test
    void rendersBindingsInTheExportedQueryWithoutChangingTheExecutedSql() throws SQLException {
        String sql = """
                select '?', "?", $$?$$, payload ?? ? /* ? */
                from documents where id = ? and active = ? and note is distinct from ?
                """;
        Map<String, String> attributes = observe(sql, true, true, statement -> {
            statement.setString(1, "O'Neil");
            statement.setLong(2, 42L);
            statement.setBoolean(3, true);
            statement.setNull(4, Types.VARCHAR);
        });

        assertThat(attributes.get("jdbc.query[0]"))
                .contains("select '?', \"?\", $$?$$, payload ? 'O''Neil' /* ? */")
                .contains("where id = 42 and active = TRUE and note is distinct from NULL");
        assertThat(attributes).doesNotContainKey("jdbc.params[0]");
    }

    @Test
    void rendersAuthenticationBindingsWithoutMasking() throws SQLException {
        Map<String, String> attributes = observe("update auth_users set user_password = ? where login_id = ?", true, true,
                statement -> {
                    statement.setString(1, "fixture-value-" + "x".repeat(300));
                    statement.setString(2, "test-user");
                });

        assertThat(attributes.get("jdbc.query[0]"))
                .isEqualTo("update auth_users set user_password = 'fixture-value-" + "x".repeat(300) + "' where login_id = 'test-user'");
        assertThat(attributes).doesNotContainKey("jdbc.params[0]");
    }

    @Test
    void retainsEmailTextInGenericQueryBindings() throws SQLException {
        Map<String, String> attributes = observe("select * from documents where note ilike ?", true, true,
                statement -> statement.setString(1, "%fixture@example.test%"));

        assertThat(attributes).containsEntry("jdbc.query[0]", "select * from documents where note ilike '%fixture@example.test%'")
                .doesNotContainKey("jdbc.params[0]");
    }

    @Test
    void preservesThePlaceholderWhenParameterExportIsDisabled() throws SQLException {
        String sql = "select * from auth_users where login_id = ?";
        assertThat(observe(sql, false, true, statement -> statement.setString(1, "fixture-user")))
                .containsEntry("jdbc.query[0]", sql)
                .doesNotContainKey("jdbc.params[0]");
    }

    @Test
    void retainsParameterTagsWhenInlineRenderingIsDisabled() throws SQLException {
        String sql = "select * from documents where id = ?";
        assertThat(observe(sql, true, false, statement -> statement.setLong(1, 42L)))
                .containsEntry("jdbc.query[0]", sql)
                .containsKey("jdbc.params[0]");
    }

    private static Map<String, String> observe(
            String sql, boolean includeParameters, boolean renderParameters, Binding binding
    ) throws SQLException {
        var observations = ObservationRegistry.create();
        var spans = new ArrayList<Map<String, String>>();
        observations.observationConfig().observationHandler(new ObservationHandler<Observation.Context>() {
            @Override
            public boolean supportsContext(Observation.Context context) {
                return context instanceof QueryContext;
            }

            @Override
            public void onStop(Observation.Context context) {
                var values = context.getHighCardinalityKeyValues().stream()
                        .collect(Collectors.toMap(KeyValue::getKey, KeyValue::getValue));
                spans.add(values);
            }
        });
        var beans = new StaticListableBeanFactory(Map.of("observationRegistry", observations));
        var processor = new JdbcObservationDataSourcePostProcessor(
                beans.getBeanProvider(ObservationRegistry.class), includeParameters, renderParameters);
        var source = mock(DataSource.class);
        var connection = mock(Connection.class);
        var metadata = mock(DatabaseMetaData.class);
        var statement = mock(PreparedStatement.class);
        when(source.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(metadata);
        when(metadata.getURL()).thenReturn("jdbc:postgresql://localhost/test");
        when(connection.prepareStatement(sql)).thenReturn(statement);

        var observed = (DataSource) processor.postProcessAfterInitialization(source, "testDataSource");
        try (var observedConnection = observed.getConnection();
             var observedStatement = observedConnection.prepareStatement(sql)) {
            binding.set(observedStatement);
            observedStatement.execute();
        }
        verify(connection).prepareStatement(sql);
        verify(statement).execute();
        assertThat(spans).hasSize(1);
        return spans.getFirst();
    }

    @FunctionalInterface
    private interface Binding {
        void set(PreparedStatement statement) throws SQLException;
    }
}
