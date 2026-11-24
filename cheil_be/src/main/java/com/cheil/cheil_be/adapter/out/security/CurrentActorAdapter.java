package com.cheil.cheil_be.adapter.out.security;

import com.cheil.cheil_be.application.common.port.out.AuthenticatedAccountPort;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class CurrentActorAdapter implements CurrentActorPort, AuthenticatedAccountPort {
    @Override
    public String currentActor() {
        return AuditActorResolver.resolve();
    }

    @Override
    public Optional<String> authenticatedEmployeeNo() {
        return AuditActorResolver.currentEmployeeNo();
    }
}
