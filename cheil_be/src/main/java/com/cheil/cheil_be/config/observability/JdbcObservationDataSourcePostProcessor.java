package com.cheil.cheil_be.config.observability;

import java.util.EnumSet;
import java.util.List;

import javax.sql.DataSource;

import net.ttddyy.dsproxy.ExecutionInfo;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import net.ttddyy.observation.tracing.DataSourceObservationListener;
import net.ttddyy.observation.tracing.JdbcObservationDocumentation;
import net.ttddyy.observation.tracing.QueryContext;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@Profile({ "local", "dev", "prod" })
public class JdbcObservationDataSourcePostProcessor implements BeanPostProcessor {

    private final ObjectProvider<ObservationRegistry> observationRegistryProvider;
    private final boolean includeParameterValues;
    private final boolean renderQueryParameters;

    public JdbcObservationDataSourcePostProcessor(
            ObjectProvider<ObservationRegistry> observationRegistryProvider,
            @Value("${app.observability.jdbc.include-parameter-values:false}") boolean includeParameterValues,
            @Value("${app.observability.jdbc.render-query-parameters:false}") boolean renderQueryParameters
    ) {
        this.observationRegistryProvider = observationRegistryProvider;
        this.includeParameterValues = includeParameterValues;
        this.renderQueryParameters = renderQueryParameters;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!(bean instanceof DataSource dataSource)) {
            return bean;
        }

        DataSourceObservationListener listener = new DataSourceObservationListener(observationRegistryProvider::getObject) {
            @Override
            public void afterQuery(ExecutionInfo execution, List<QueryInfo> queries) {
                if (includeParameterValues && renderQueryParameters) {
                    QueryContext context = execution.getCustomValue(QueryContext.class.getName(), QueryContext.class);
                    if (context != null) {
                        context.setQueries(queries.stream().map(JdbcTraceQueryRenderer::render).toList());
                    }
                }
                super.afterQuery(execution, queries);
            }
        };
        listener.setIncludeParameterValues(includeParameterValues && !renderQueryParameters);
        listener.setSupportedTypes(EnumSet.of(
                JdbcObservationDocumentation.CONNECTION,
                JdbcObservationDocumentation.QUERY,
                JdbcObservationDocumentation.RESULT_SET
        ));

        ProxyDataSourceBuilder builder = ProxyDataSourceBuilder.create(dataSource)
                .listener(listener)
                .methodListener(listener)
                .proxyResultSet();

        return builder.build();
    }
}
