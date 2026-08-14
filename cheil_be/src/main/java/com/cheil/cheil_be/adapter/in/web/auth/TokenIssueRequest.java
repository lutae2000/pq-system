package com.cheil.cheil_be.adapter.in.web.auth;

import java.util.Set;

public record TokenIssueRequest(Set<String> scopes) {

    Set<String> normalizedScopes() {
        return scopes == null ? Set.of() : Set.copyOf(scopes);
    }
}
