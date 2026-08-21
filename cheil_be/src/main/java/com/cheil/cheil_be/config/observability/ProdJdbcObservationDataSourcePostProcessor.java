package com.cheil.cheil_be.config.observability;

import java.util.EnumSet;

import javax.sql.DataSource;

import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import net.ttddyy.observation.tracing.DataSourceObservationListener;
import net.ttddyy.observation.tracing.JdbcObservationDocumentation;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@Profile({ "local", "dev", "prod" })
public class ProdJdbcObservationDataSourcePostProcessor implements BeanPostProcessor {

    private final ObjectProvider<ObservationRegistry> observationRegistryProvider;

    @Value("${app.observability.jdbc.include-parameter-values:false}")
    private boolean includeParameterValues;

    public ProdJdbcObservationDataSourcePostProcessor(ObjectProvider<ObservationRegistry> observationRegistryProvider) {
        this.observationRegistryProvider = observationRegistryProvider;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!(bean instanceof DataSource dataSource)) {
            return bean;
        }

        DataSourceObservationListener listener = new DataSourceObservationListener(observationRegistryProvider::getObject);
        listener.setIncludeParameterValues(includeParameterValues);
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
