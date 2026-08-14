package com.cheil.cheil_be.application.commondepartment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.ArgumentMatchers.any;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUpsertCommand;
import com.cheil.cheil_be.application.commondepartment.port.out.CommonDepartmentRepository;
import com.cheil.cheil_be.domain.commondepartment.Department;

@ExtendWith(MockitoExtension.class)
class DepartmentAdminServiceTest {

    private final InMemoryCommonDepartmentRepository repository = new InMemoryCommonDepartmentRepository();
    private final DepartmentCacheService departmentCacheService = mock(DepartmentCacheService.class);
    private final DepartmentAdminService service = new DepartmentAdminService(
            repository,
            departmentCacheService,
            Clock.fixed(Instant.parse("2026-06-18T00:00:00Z"), ZoneOffset.UTC)
    );

    @BeforeEach
    void setUp() {
        when(departmentCacheService.getOrLoadAll(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Supplier<List<Department>> loader = invocation.getArgument(0);
            return loader.get();
        });
        when(departmentCacheService.getOrLoadByDeptCode(any(), any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Supplier<Optional<Department>> loader = invocation.getArgument(1);
            return loader.get();
        });
        doNothing().when(departmentCacheService).refreshAfterCommit(any(), any());
    }

    @Test
    void createRejectsOverlongValuesBeforeJpaCommit() {
        Throwable thrown = catchThrowable(() -> service.create(new CommonDepartmentUpsertCommand(
                "D".repeat(21),
                "\uBD80\uC11C",
                "1",
                "20",
                true,
                "2999-12-31",
                "100",
                "admin",
                "admin",
                "0001",
                false,
                null
        )));

        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        ResponseStatusException ex = (ResponseStatusException) thrown;
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).contains("deptCode");
        assertThat(repository.savedCount()).isZero();
    }

    @Test
    void createStoresValidDepartment() {
        Department created = service.create(new CommonDepartmentUpsertCommand(
                "D001",
                "\uBD80\uC11C",
                "1",
                "20",
                true,
                "2999-12-31",
                "100",
                "admin",
                "admin",
                "0001",
                false,
                null
        ));

        assertThat(created.deptCode()).isEqualTo("D001");
        assertThat(repository.savedCount()).isEqualTo(1);
    }

    @Test
    void updateUsesRequestInputDutyIdInsteadOfKeepingStaleStoredValue() {
        repository.put(new Department(
                "DSR000",
                "\uB4F1\uB85D\uC870\uC9C1",
                "1",
                "20",
                true,
                null,
                "DSR000",
                "LEGACY-TOO-LONG",
                Instant.parse("2026-06-18T00:00:00Z"),
                "OLD",
                Instant.parse("2026-06-18T00:00:00Z"),
                "1",
                false,
                null
        ));

        Department updated = service.update("DSR000", new CommonDepartmentUpsertCommand(
                "DSR000",
                "\uB3C4\uB85C\uC0AC\uC5C5\uBD80 \uD14C\uC2A4\uD2B8",
                "1",
                "20",
                true,
                "2999-12-31",
                "DSR000",
                "F0000",
                "F0000",
                "1",
                false,
                "DSR000"
        ));

        assertThat(updated.inputDutyId()).isEqualTo("F0000");
        assertThat(updated.chgDutyId()).isEqualTo("F0000");
    }

    @Test
    void updateRejectsMismatchedPathAndBodyDeptCode() {
        repository.put(new Department(
                "DSR000",
                "\uB4F1\uB85D\uC870\uC9C1",
                "1",
                "20",
                true,
                null,
                "DSR000",
                "F0000",
                Instant.parse("2026-06-18T00:00:00Z"),
                "F0000",
                Instant.parse("2026-06-18T00:00:00Z"),
                "1",
                false,
                null
        ));

        Throwable thrown = catchThrowable(() -> service.update("DSR000", new CommonDepartmentUpsertCommand(
                "DSR999",
                "\uB3C4\uB85C\uC0AC\uC5C5\uBD80 \uD14C\uC2A4\uD2B8",
                "1",
                "20",
                true,
                "2999-12-31",
                "DSR000",
                "F0000",
                "F0000",
                "1",
                false,
                "DSR000"
        )));

        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        ResponseStatusException ex = (ResponseStatusException) thrown;
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private static final class InMemoryCommonDepartmentRepository implements CommonDepartmentRepository {

        private final Map<String, Department> departments = new HashMap<>();

        @Override
        public List<Department> findAll() {
            return departments.values().stream().toList();
        }

        @Override
        public Optional<Department> findByDeptCode(String deptCode) {
            return Optional.ofNullable(departments.get(deptCode));
        }

        @Override
        public boolean existsByDeptCode(String deptCode) {
            return departments.containsKey(deptCode);
        }

        @Override
        public Department save(Department commonDepartment) {
            departments.put(commonDepartment.deptCode(), commonDepartment);
            return commonDepartment;
        }

        int savedCount() {
            return departments.size();
        }

        void put(Department commonDepartment) {
            departments.put(commonDepartment.deptCode(), commonDepartment);
        }
    }
}
