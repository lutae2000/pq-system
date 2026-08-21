package com.cheil.cheil_be.config.observability;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.web.ClientIpResolver;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceRequestAttributesFilter extends OncePerRequestFilter {

    private final ObjectProvider<ObservationRegistry> observationRegistryProvider;

    public TraceRequestAttributesFilter(ObjectProvider<ObservationRegistry> observationRegistryProvider) {
        this.observationRegistryProvider = observationRegistryProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        addTraceAttributes(request);
        filterChain.doFilter(request, response);
    }

    private void addTraceAttributes(HttpServletRequest request) {
        ObservationRegistry observationRegistry = observationRegistryProvider.getIfAvailable();
        Observation observation = observationRegistry == null ? null : observationRegistry.getCurrentObservation();
        if (observation == null) {
            return;
        }

        addAttribute(observation, "user.id", firstNonBlank(
                request.getAttribute("loginId"),
                request.getHeader(SecurityHeaders.LOGIN_ID)
        ));
        addAttribute(observation, "client.address", ClientIpResolver.resolve(request));
        addAttribute(observation, "app.program_code", request.getHeader(SecurityHeaders.PROGRAM_CODE));
        addAttribute(observation, "app.service_id", request.getHeader("x-service-id"));
    }

    private static void addAttribute(Observation observation, String key, String value) {
        if (value != null && !value.isBlank()) {
            observation.highCardinalityKeyValue(key, value);
        }
    }

    private static String firstNonBlank(Object attributeValue, String headerValue) {
        if (attributeValue instanceof String value && !value.isBlank()) {
            return value;
        }
        return headerValue;
    }
}
