package com.cheil.cheil_be.application.servicetype.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import com.cheil.cheil_be.application.servicetype.exception.ServiceTypeApplicationException;
import com.cheil.cheil_be.application.servicetype.port.in.ServiceTypeUpsertCommand;
import com.cheil.cheil_be.application.servicetype.port.out.ServiceTypeRepository;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

class ServiceTypeAdminServiceTest {

    private final InMemoryServiceTypeRepository repository = new InMemoryServiceTypeRepository();
    private final ServiceTypeAdminService service = new ServiceTypeAdminService(repository);

    @Test
    void createNormalizesCodeAndDefaultsOmittedUseYnToActive() {
        ServiceType result = service.create(new ServiceTypeUpsertCommand("  road ", "도로", null));

        assertThat(result.serviceTypeCode()).isEqualTo("road");
        assertThat(result.serviceTypeName()).isEqualTo("도로");
        assertThat(result.useYn()).isTrue();
    }

    @Test
    void createRejectsNullRequestAsBadRequest() {
        assertThatThrownBy(() -> service.create(null))
                .isInstanceOf(ServiceTypeApplicationException.class)
                .hasMessageContaining("request body");
    }

    @Test
    void updateRejectsNullRequestAsBadRequest() {
        assertThatThrownBy(() -> service.update("road", null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("request body");
    }

    private static final class InMemoryServiceTypeRepository implements ServiceTypeRepository {

        private final List<ServiceType> serviceTypes = new ArrayList<>();

        @Override
        public List<ServiceType> findAll() {
            return List.copyOf(serviceTypes);
        }

        @Override
        public Optional<ServiceType> findByServiceTypeCode(String serviceTypeCode) {
            return serviceTypes.stream()
                    .filter(serviceType -> serviceType.serviceTypeCode().equals(serviceTypeCode))
                    .findFirst();
        }

        @Override
        public boolean existsByServiceTypeCode(String serviceTypeCode) {
            return findByServiceTypeCode(serviceTypeCode).isPresent();
        }

        @Override
        public ServiceType save(ServiceType serviceType) {
            serviceTypes.removeIf(existing -> existing.serviceTypeCode().equals(serviceType.serviceTypeCode()));
            serviceTypes.add(serviceType);
            return serviceType;
        }

        @Override
        public void deleteByServiceTypeCode(String serviceTypeCode) {
            serviceTypes.removeIf(serviceType -> serviceType.serviceTypeCode().equals(serviceTypeCode));
        }
    }
}
