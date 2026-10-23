package com.cheil.cheil_be.application.systempermission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.systempermission.model.RolePermission;
import com.cheil.cheil_be.application.systempermission.model.RolePermissionCommand;
import com.cheil.cheil_be.application.systempermission.model.SystemRole;
import com.cheil.cheil_be.application.systempermission.port.out.SystemPermissionRepository;

class SystemPermissionAdminServiceTest {

    private final SystemPermissionRepository repository = mock(SystemPermissionRepository.class);
    private final CurrentActorPort currentActorPort = mock(CurrentActorPort.class);
    private final Instant now = Instant.parse("2026-10-22T00:00:00Z");
    private final SystemPermissionAdminService service = new SystemPermissionAdminService(
            repository, currentActorPort, Clock.fixed(now, ZoneOffset.UTC)
    );

    @Test
    void saveRolePermissionsNormalizesMenuCodeAndUsesCurrentActor() {
        SystemRole role = new SystemRole("ADMIN", "관리자", true, 1, null);
        RolePermission permission = new RolePermission(
                "ADMIN", "USER", "사용자", null, "/users", "MENU", 1,
                true, true, null, true, false, false, false,
                now, "tester", now, "tester"
        );
        when(repository.findRole("ADMIN")).thenReturn(Optional.of(role));
        when(currentActorPort.currentActor()).thenReturn("tester");
        when(repository.findRolePermissions("ADMIN")).thenReturn(List.of(permission));

        List<RolePermission> result = service.saveRolePermissions(
                " ADMIN ", List.of(new RolePermissionCommand(" USER ", true, false, false, false)), null
        );

        assertThat(result).containsExactly(permission);
        verify(repository).saveRolePermissions(
                "ADMIN", List.of(new RolePermissionCommand("USER", true, false, false, false)), "tester", now
        );
    }
}
