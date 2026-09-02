package com.cheil.cheil_be.config.security;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.security")
public record AppSecurityProperties(
        Token token,
        UserSession userSession,
        Map<String, Integration> integrations,
        Filter filter,
        Cors cors
) {

    public AppSecurityProperties {
        token = token == null ? Token.defaults() : token;
        userSession = userSession == null ? UserSession.defaults() : userSession;
        integrations = integrations == null ? Map.of() : Map.copyOf(integrations);
        filter = filter == null ? new Filter(null, null, null) : filter;
        cors = cors == null ? Cors.defaults() : cors;
    }

    public record Token(String issuer, String secret, Duration ttl) {

        public Token {
            issuer = StringUtils.hasText(issuer) ? issuer : "cheil-be";
            if (!StringUtils.hasText(secret)) {
                throw new IllegalArgumentException("app.security.token.secret must not be blank");
            }
            ttl = ttl == null ? Duration.ofHours(1) : ttl;
        }

        static Token defaults() {
            return new Token("cheil-be", "change-this-token-secret-at-runtime", Duration.ofHours(1));
        }
    }

    public record Integration(String serviceId, String apiKey) {
    }

    public record UserSession(Duration ttl, Duration idleTtl) {

        public UserSession {
            ttl = ttl == null ? Duration.ofHours(4) : ttl;
            idleTtl = idleTtl == null ? Duration.ofHours(1) : idleTtl;
        }

        static UserSession defaults() {
            return new UserSession(Duration.ofHours(4), Duration.ofHours(1));
        }
    }

    public record Filter(List<String> excludedPaths, List<String> loginExcludedPaths, List<String> authenticatedOnlyPaths) {

        public Filter {
            excludedPaths = excludedPaths == null ? List.of() : List.copyOf(excludedPaths);
            loginExcludedPaths = loginExcludedPaths == null ? List.of() : List.copyOf(loginExcludedPaths);
            authenticatedOnlyPaths = authenticatedOnlyPaths == null ? List.of() : List.copyOf(authenticatedOnlyPaths);
        }
    }

    public record Cors(
            List<String> allowedOrigins,
            List<String> allowedOriginPatterns,
            List<String> allowedMethods,
            List<String> allowedHeaders,
            List<String> exposedHeaders,
            Boolean allowCredentials,
            Long maxAge
    ) {

        public Cors {
            allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
            allowedOriginPatterns = allowedOriginPatterns == null ? List.of("*") : List.copyOf(allowedOriginPatterns);
            allowedMethods = allowedMethods == null ? List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") : List.copyOf(allowedMethods);
            allowedHeaders = allowedHeaders == null ? List.of(
                    "Accept",
                    "Authorization",
                    "Content-Type",
                    "Origin",
                    "x-api-key",
                    "x-service-id",
                    "x-login-id",
                    "x-program-code"
            ) : List.copyOf(allowedHeaders);
            exposedHeaders = exposedHeaders == null ? List.of() : List.copyOf(exposedHeaders);
            allowCredentials = allowCredentials != null && allowCredentials;
            maxAge = maxAge == null ? 3600L : maxAge;
        }

        static Cors defaults() {
            return new Cors(null, null, null, null, null, false, 3600L);
        }
    }
}
